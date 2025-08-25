import time
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .permissions import IsPartyParticipant
from .serializers import MyPartySerializer, PartyParticipantSerializer, StandbyStateSerializer
from django.utils.timezone import now
from django.db import transaction, F
from detailview.models import Party, Participation
from game.models import BalanceRound, BalanceQuestion, PartyWaitState
from utils.gameAI import generate_balance_by_ai  # AI 문항 생성 유틸


class MyPartyViewSet(viewsets.ReadOnlyModelViewSet):
    """내가 참여한 파티 목록"""
    # permission_classes = [IsAuthenticated]
    serializer_class = MyPartySerializer

    def get_queryset(self):
        return Party.objects.filter(
            participations__user=self.request.user,
            start_time__gt=now(),
            is_cancelled=False
        )


class StandbyViewSet(viewsets.ViewSet):
    """대기(standby) 상태 토글 + 과반수 시 라운드 자동 생성"""
    permission_classes = [IsAuthenticated, IsPartyParticipant]

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        party_id = int(pk)
        participation = get_object_or_404(Participation, party_id=party_id, user=request.user)

        with transaction.atomic():
            # 1) standby 토글
            participation.is_standby = not participation.is_standby
            participation.save()

            # 2) 상태 버전 업데이트 (롱폴링을 위함)
            PartyWaitState.objects.filter(party_id=party_id).update(version=F('version') + 1)

            # 3) 카운트 계산
            party = Party.objects.select_for_update().get(pk=party_id)
            participation_count = party.participations.count()
            standby_count = party.participations.filter(is_standby=True).count()

            # 4) 조건: standby 인원이 과반수 초과 & 아직 활성 라운드 없음
            condition_met = standby_count > (participation_count / 2)
            has_active_round = BalanceRound.objects.filter(party=party, is_active=True).exists()

            if condition_met and not has_active_round:
                try:
                    # AI를 이용해 게임 생성
                    ai_result = generate_balance_by_ai(party, count=5)
                    items = ai_result.get("items", [])

                    new_round = BalanceRound.objects.create(
                        party=party, created_by=request.user, is_active=True
                    )
                    BalanceQuestion.objects.bulk_create([
                        BalanceQuestion(round=new_round, order=i + 1, a_text=it["a"], b_text=it["b"])
                        for i, it in enumerate(items)
                    ])
                    # 게임이 생성되었으므로 상태 버전을 한 번 더 업데이트
                    PartyWaitState.objects.filter(party_id=party_id).update(version=F('version') + 1)
                
                except Exception as e:
                    # 게임 생성 실패 시 롤백되므로 별도 처리 불필요
                    # 로깅 등을 추가할 수 있음
                    print(f"게임 생성 실패: {e}")
                    pass # 오류가 나도 현재 상태는 반환

        # 5) 현재 파티의 최신 상태를 반환
        party.refresh_from_db()
        serializer = StandbyStateSerializer(party, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """참여자 목록 조회"""
        party = get_object_or_404(Party, pk=pk)
        # 파티 시작 시간 제약 조건은 요구사항에 따라 유지
        if party.start_time > now():
            return Response({"detail": "파티 시작 이후에만 참여자 목록을 볼 수 있습니다."}, status=403)
        
        participants = Participation.objects.filter(party=party).select_related("user")
        serializer = PartyParticipantSerializer(participants, many=True, context={"request": request})
        return Response(serializer.data, status=200)


class StandbyPollViewSet(APIView):
    """
    대기실 상태 롱폴링
    GET /api/v1/standby/<party_id>/poll/?version=<client_version>
    """
    permission_classes = [IsAuthenticated, IsPartyParticipant]

    def get(self, request, pk=None):
        party_id = int(pk)
        client_version = int(request.query_params.get("version", 0))

        # 타임아웃 설정 (초)
        timeout = 25
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            wait_state = get_object_or_404(PartyWaitState, party_id=party_id)
            
            # 서버 버전이 클라이언트 버전보다 높으면 변경된 것
            if wait_state.version > client_version:
                party = Party.objects.get(pk=party_id)
                serializer = StandbyStateSerializer(party, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # DB 부하를 줄이기 위해 짧게 대기
            time.sleep(0.5)

        # 타임아웃까지 변경사항 없으면 204 No Content 응답
        return Response(status=status.HTTP_204_NO_CONTENT)
    