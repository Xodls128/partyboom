from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
import time

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BalanceRound, BalanceQuestion, RoundState
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
        q.refresh_from_db(fields=["vote_a_count", "vote_b_count"])

        # RoundState 버전 업데이트
        RoundState.objects.filter(round_id=q.round_id).update(version=F("version") + 1)

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

class RoundStateView(APIView):
    """GET /api/v1/game/rounds/<round_id>/state/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, round_id):
        client_version = request.query_params.get("version", 0)
        try:
            client_version = int(client_version)
        except (ValueError, TypeError):
            client_version = 0

        # 30초 동안 1초 간격으로 상태 변화 확인
        for _ in range(30):
            try:
                round_state = RoundState.objects.get(round_id=round_id)
                if round_state.version > client_version:
                    round_obj = (
                        BalanceRound.objects.select_related("party", "created_by")
                        .prefetch_related("questions")
                        .get(pk=round_id)
                    )
                    return Response({
                        "version": round_state.version,
                        "data": BalanceRoundReadSerializer(round_obj).data
                    }, status=status.HTTP_200_OK)
                else:
                    time.sleep(1)
            except RoundState.DoesNotExist:
                return Response({"detail": "라운드를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)