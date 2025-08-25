from django.db import transaction, IntegrityError
from django.db.models import F
from rest_framework import serializers

from .models import BalanceRound, BalanceQuestion, BalanceVote
from detailview.models import Party  # party_id 유효성 체크용


# 문항 시리얼라이저
class BalanceQuestionReadSerializer(serializers.ModelSerializer):
    """밸런스게임의 개별 질문 하나"""
    class Meta:
        model = BalanceQuestion
        fields = ("id", "order", "a_text", "b_text", "vote_a_count", "vote_b_count")


# 라운드 시리얼라이저
class BalanceRoundReadSerializer(serializers.ModelSerializer):
    """라운드 전체 + 문항 리스트"""
    questions = BalanceQuestionReadSerializer(many=True, read_only=True)

    class Meta:
        model = BalanceRound
        fields = (
            "id", "party", "created_by", "model_used",
            "is_active", "created_at", "closed_at", "questions",
            "last_updated_at",  # 클라이언트에 전달할 필드 추가
        )


# AI 라운드 생성 요청 (standby 조건 충족 시 내부적으로 사용)
class RoundCreateAIRequestSerializer(serializers.Serializer):
    party_id = serializers.IntegerField()
    count = serializers.IntegerField(required=False, min_value=1, max_value=20, default=5)

    def validate_party_id(self, value):
        if not Party.objects.filter(pk=value).exists():
            raise serializers.ValidationError("유효하지 않은 party_id 입니다.")
        return value


# 투표 생성 (1인 1표, 카운트 즉시 반영)
class VoteCreateSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice = serializers.ChoiceField(choices=BalanceVote.Choice.choices)

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            raise serializers.ValidationError("인증된 사용자만 투표할 수 있습니다.")

        # 문항 조회
        try:
            q = BalanceQuestion.objects.select_related("round").get(pk=attrs["question_id"])
        except BalanceQuestion.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 question_id 입니다.")

        # 라운드 진행 여부 확인
        if not q.round.is_active:
            raise serializers.ValidationError("종료된 라운드에는 투표할 수 없습니다.")

        # 파티 참가자 검증 (CONFIRMED 상태만 허용)
        party = q.round.party
        if not party.participations.filter(user=user, status="CONFIRMED").exists():
            raise serializers.ValidationError("해당 파티 참가자만 투표할 수 있습니다.")

        # 중복 투표 방지
        if BalanceVote.objects.filter(question=q, user=user).exists():
            raise serializers.ValidationError("이미 이 문항에 투표했습니다.")

        attrs["question_obj"] = q
        attrs["user_obj"] = user
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        q: BalanceQuestion = validated_data["question_obj"]
        user = validated_data["user_obj"]
        choice = validated_data["choice"]

        # 1인 1표 보장
        try:
            vote = BalanceVote.objects.create(question=q, user=user, choice=choice)
        except IntegrityError:
            raise serializers.ValidationError("이미 이 문항에 투표했습니다.")

        # 실시간 집계 반영
        if choice == BalanceVote.Choice.A:
            BalanceQuestion.objects.filter(pk=q.pk).update(vote_a_count=F("vote_a_count") + 1)
        else:
            BalanceQuestion.objects.filter(pk=q.pk).update(vote_b_count=F("vote_b_count") + 1)

        return vote
    