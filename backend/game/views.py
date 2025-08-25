import time
from datetime import datetime, timezone

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone as django_timezone

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BalanceRound
from .serializers import (
    BalanceRoundReadSerializer,
    BalanceQuestionReadSerializer,
    VoteCreateSerializer,
)


class RoundRetrieveView(APIView):
    """GET /api/v1/game/rounds/<round_id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, round_id):
        round_obj = (
            BalanceRound.objects
            .select_related("party", "created_by")
            .prefetch_related("questions")
            .get(pk=round_id)
        )
        return Response(BalanceRoundReadSerializer(round_obj).data, status=status.HTTP_200_OK)


class VoteCreateView(APIView):
    """POST /api/v1/game/questions/<question_id>/vote/"""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, question_id: int):
        payload = {"question_id": question_id, **request.data}
        ser = VoteCreateSerializer(data=payload, context={"request": request})
        ser.is_valid(raise_exception=True)
        vote = ser.save()

        q = vote.question
        
        # 라운드의 last_updated_at을 갱신하여 변경 알림
        round_obj = q.round
        round_obj.last_updated_at = django_timezone.now()
        round_obj.save(update_fields=['last_updated_at'])

        q.refresh_from_db(fields=["vote_a_count", "vote_b_count"])

        return Response(BalanceQuestionReadSerializer(q).data, status=status.HTTP_201_CREATED)


class RoundPollView(APIView):
    """
    GET /api/v1/game/rounds/<round_id>/poll/
    → Long-polling으로 라운드 데이터의 변경사항을 확인
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, round_id):
        last_seen_str = request.query_params.get("last_seen_timestamp")
        last_seen_dt = None

        if last_seen_str:
            try:
                # 클라이언트가 보낸 timestamp를 UTC 기준으로 파싱
                last_seen_dt = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
            except ValueError:
                return Response({"error": "잘못된 타임스탬프 형식입니다."}, status=status.HTTP_400_BAD_REQUEST)

        round_obj = get_object_or_404(BalanceRound, pk=round_id)

        # 롱폴링 타임아웃 설정 (예: 25초)
        timeout = 25
        start_time = time.time()

        while time.time() - start_time < timeout:
            round_obj.refresh_from_db(fields=['last_updated_at'])

            # 클라이언트가 본 시간보다 최신 업데이트가 있는 경우
            if not last_seen_dt or round_obj.last_updated_at > last_seen_dt:
                # 최신 라운드 데이터를 직렬화하여 반환
                full_round_data = (
                    BalanceRound.objects
                    .select_related("party", "created_by")
                    .prefetch_related("questions")
                    .get(pk=round_id)
                )
                serializer = BalanceRoundReadSerializer(full_round_data)
                return Response(serializer.data, status=status.HTTP_200_OK)

            # DB 부하를 줄이기 위해 짧은 시간 대기
            time.sleep(1)

        # 타임아웃까지 변경사항이 없으면 204 No Content 응답
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActiveRoundCheckView(APIView):
    """
    GET /api/v1/game/parties/<party_id>/active-round/
    → 특정 파티에 현재 활성화된 라운드가 있는지 확인
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, party_id):
        active_round = BalanceRound.objects.filter(party_id=party_id, is_active=True).first()

        if active_round:
            return Response({"round_id": active_round.id}, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "진행 중인 게임이 없습니다."},
                status=status.HTTP_404_NOT_FOUND
            )
        