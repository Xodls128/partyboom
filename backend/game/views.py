from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BalanceRound, BalanceQuestion
from .serializers import (
    BalanceRoundReadSerializer,
    BalanceQuestionReadSerializer,
    VoteCreateSerializer,
)

# WebSocket 관련 임포트
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


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
        q.refresh_from_db(fields=["vote_a_count", "vote_b_count"])

        # 투표 집계 결과를 WebSocket으로 브로드캐스트
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"round_{q.round_id}",
            {
                "type": "vote_update",
                "data": {
                    "question_id": q.id,
                    "round_id": str(q.round_id),
                    "vote_a_count": q.vote_a_count,
                    "vote_b_count": q.vote_b_count,
                }
            }
        )

        return Response(BalanceQuestionReadSerializer(q).data, status=status.HTTP_201_CREATED)


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
        