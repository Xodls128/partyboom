from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from detailview.models import Party
from .models import BalanceRound, BalanceQuestion
from .serializers import (
    BalanceRoundReadSerializer,
    BalanceQuestionReadSerializer,
    RoundCreateAIRequestSerializer,
    VoteCreateSerializer,
)
# Party 컨텍스트 기반 밸런스 문항 생성 유틸 함수
from utils.gameAI import generate_balance_by_ai

# WebSocket 관련 임포트
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class RoundAICreateView(APIView):
    """
    POST /api/v1/game/rounds/ai-create
    Body: { "party_id": 123, "count": 5 }
    → Party 정보를 맥락으로 AI에게 문항 생성 요청, Round/Question 저장 후 반환
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        ser = RoundCreateAIRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        party_id = ser.validated_data["party_id"]
        count = ser.validated_data["count"]

        # Party 컨텍스트 로드 (장소/태그 포함)
        party = get_object_or_404(
            Party.objects.select_related("place").prefetch_related("tags"),
            pk=party_id
        )

        # 1) AI 호출
        result = generate_balance_by_ai(party, count=count)
        items = result.get("items", [])

        # 2) Round & Questions 저장
        round_obj = BalanceRound.objects.create(
            party=party,
            created_by=request.user if request.user.is_authenticated else None,
            model_used="gpt-4o-mini",
            is_active=True,
        )
        BalanceQuestion.objects.bulk_create([
            BalanceQuestion(
                round=round_obj,
                order=i + 1,
                a_text=it["a"],
                b_text=it["b"],
            )
            for i, it in enumerate(items)
        ])

        # 3) 응답 (질문 포함)
        round_obj = (
            BalanceRound.objects
            .select_related("party", "created_by")
            .prefetch_related("questions")
            .get(pk=round_obj.pk)
        )
        return Response(BalanceRoundReadSerializer(round_obj).data, status=status.HTTP_201_CREATED)


class RoundRetrieveView(APIView):
    """
    GET /api/v1/game/rounds/<round_uuid>/
    → 라운드 + 문항(집계 포함) 조회 (실시간 폴링에 사용)
    """
    permission_classes = [permissions.IsAuthenticated]  # 인증 필요

    def get(self, request, round_id):
        round_obj = (
            BalanceRound.objects
            .select_related("party", "created_by")
            .prefetch_related("questions")
            .get(pk=round_id)
        )
        return Response(BalanceRoundReadSerializer(round_obj).data, status=status.HTTP_200_OK)


class VoteCreateView(APIView):
    """
    POST /api/v1/game/questions/<question_id>/vote/
    Body: { "choice": "A" } or { "choice": "B" }
    → 1인 1표 검증 & 카운트 증가 후, 해당 문항의 최신 스냅샷 반환
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, question_id: int):
        # URL의 question_id를 payload에 주입
        payload = {"question_id": question_id, **request.data}
        ser = VoteCreateSerializer(data=payload, context={"request": request})
        ser.is_valid(raise_exception=True)
        vote = ser.save()

        # 업데이트된 문항만 가볍게 반환
        q = vote.question
        q.refresh_from_db(fields=["vote_a_count", "vote_b_count"])

        # WebSocket 브로드캐스트
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"round_{q.round_id}",
            {
                "type": "vote_update",
                "question_id": q.id,
                "round_id": str(q.round_id),   # 라운드 정보도 같이
                "vote_a_count": q.vote_a_count,
                "vote_b_count": q.vote_b_count,
            }
        )


        return Response(BalanceQuestionReadSerializer(q).data, status=status.HTTP_201_CREATED)