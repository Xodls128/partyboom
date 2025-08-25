from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsPartyParticipant
from .serializers import MyPartySerializer, PartyParticipantSerializer
from django.utils.timezone import now
from django.db import transaction, F
from detailview.models import Party, Participation
from game.models import BalanceRound, BalanceQuestion
from utils.gameAI import generate_balance_by_ai  # AI 문항 생성 유틸
from .models import PartyWaitState
import time

class MyPartyViewSet(viewsets.ReadOnlyModelViewSet):
    """내가 참여한 파티 목록"""
    permission_classes = [IsAuthenticated]
    serializer_class = MyPartySerializer

    def get_queryset(self):
        return Party.objects.filter(
            participations__user=self.request.user,
            start_time__gt=now(),
            is_cancelled=False
        )

class StandbyViewSet(viewsets.ViewSet):
    """대기(standby) 상태 토글 + 과반수 시 라운드 자동 생성"""
    permission_classes = [IsAuthenticated & IsPartyParticipant]

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        party_id = pk
        participation = get_object_or_404(Participation, party_id=party_id, user=request.user)

        with transaction.atomic():
            # 1) standby 토글
            participation.is_standby = not participation.is_standby
            participation.save()

            # 2) 카운트 계산
            participation_count = Participation.objects.filter(party_id=party_id).count()
            standby_count = Participation.objects.filter(party_id=party_id, is_standby=True).count()
            
            # 3) 대기 상태 버전 업데이트
            PartyWaitState.objects.filter(party_id=party_id).update(version=F("version") + 1)

            # 4) 조건: standby 인원이 과반수 초과 & 아직 활성 라운드 없음
            condition_met = standby_count > (participation_count / 2)
            has_active_round = BalanceRound.objects.filter(party_id=party_id, is_active=True).exists()

            if condition_met and not has_active_round:
                try:
                    party = Party.objects.get(pk=party_id)
                    ai_result = generate_balance_by_ai(party, count=5)
                    items = ai_result.get("items", [])

                    # 라운드 & 질문 생성
                    new_round = BalanceRound.objects.create(
                        party=party,
                        created_by=request.user,
                        is_active=True
                    )
                    BalanceQuestion.objects.bulk_create([
                        BalanceQuestion(round=new_round, order=i + 1, a_text=it["a"], b_text=it["b"])
                        for i, it in enumerate(items)
                    ])

                    return Response(
                        {"status": "game_created", "round_id": str(new_round.id)},
                        status=status.HTTP_201_CREATED
                    )

                except Exception as e:
                    return Response(
                        {"status": "error", "message": "게임 생성에 실패했습니다."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

        return Response({
            "party_id": party_id,
            "user_id": request.user.id,
            "is_standby": participation.is_standby,
            "participation_count": participation_count,
            "standby_count": standby_count
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """참여자 목록 조회"""
        party = get_object_or_404(Party, pk=pk)

        if party.start_time > now():
            return Response(
                {"detail": "파티 시작 이후에만 참여자 목록을 볼 수 있습니다."},
                status=403
            )

        participants = Participation.objects.filter(party=party).select_related("user")
        serializer = PartyParticipantSerializer(
            participants,
            many=True,
            context={"request": request}
        )
        return Response(serializer.data, status=200)

class PartyWaitStateView(views.APIView):
    """GET /api/v1/partyassist/wait-state/<party_id>/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, party_id):
        client_version = request.query_params.get("version", 0)
        try:
            client_version = int(client_version)
        except (ValueError, TypeError):
            client_version = 0

        # 30초 동안 1초 간격으로 상태 변화 확인
        for _ in range(30):
            try:
                wait_state = PartyWaitState.objects.get(party_id=party_id)
                if wait_state.version > client_version:
                    participation_count = Participation.objects.filter(party_id=party_id).count()
                    standby_count = Participation.objects.filter(party_id=party_id, is_standby=True).count()
                    active_round = BalanceRound.objects.filter(party_id=party_id, is_active=True).first()

                    data = {
                        "version": wait_state.version,
                        "participation_count": participation_count,
                        "standby_count": standby_count,
                        "active_round_id": str(active_round.id) if active_round else None
                    }
                    return Response(data, status=status.HTTP_200_OK)
                else:
                    time.sleep(1)
            except PartyWaitState.DoesNotExist:
                return Response({"detail": "파티를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)