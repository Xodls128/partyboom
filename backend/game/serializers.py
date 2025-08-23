from django.db import transaction, IntegrityError
from django.db.models import F
from rest_framework import serializers

from .models import BalanceRound, BalanceQuestion, BalanceVote
from detailview.models import Party  # party_id 유효성 체크용 


#문항 시리얼라이저
class BalanceQuestionReadSerializer(serializers.ModelSerializer): # 벨런스게임의 개별질문 하나의 데이터를 보여줄 시리얼라이저
    class Meta:
        model = BalanceQuestion
        fields = ("id", "order", "a_text", "b_text", "vote_a_count", "vote_b_count")

#라운드 시리얼라이저
class BalanceRoundReadSerializer(serializers.ModelSerializer): #전체 라운드 관련 시리얼라이저
    questions = BalanceQuestionReadSerializer(many=True, read_only=True) #중첩 시리얼라이저로 효율화 (개별질문을 전부 포함) : Nesting

    class Meta:
        model = BalanceRound
        fields = (
            "id", "party", "created_by", "model_used",
            "safety_blocked", "safety_reason",
            "is_active", "created_at", "closed_at", "questions",
        )
    
#AI 호출용 입력 검증 시리얼라이저 
class RoundCreateAIRequestSerializer(serializers.Serializer): # AI가 라운드를 생성할 때 필요한 입력값 검증
    party_id = serializers.IntegerField()
    count = serializers.IntegerField(required=False, min_value=1, max_value=20, default=5)

    def validate_party_id(self, value): #클라이언트가 보낸 party_id가 유효한지(실제 db에 존재하는지) 확인검증
        if not Party.objects.filter(pk=value).exists():
            raise serializers.ValidationError("유효하지 않은 party_id 입니다.")
        return value

#투표 생성 (1인 1표 , 카운트 즉시 반영)
class VoteCreateSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice = serializers.ChoiceField(choices=BalanceVote.Choice.choices)

    def validate(self, attrs): # 투표 유효성 검증
        request = self.context.get("request") # 뷰에서 넘겨준 정보를 가져옴. (로그인한 사용자 정보를 가져오기 위함
        user = getattr(request, "user", None) 
        if not user or not user.is_authenticated: 
            raise serializers.ValidationError("인증된 사용자만 투표할 수 있습니다.")

        try:
            q = BalanceQuestion.objects.select_related("round").get(pk=attrs["question_id"])
        except BalanceQuestion.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 question_id 입니다.")

        if not q.round.is_active: #투표하려는 질문(q)이 속한 라운드가 현재 진행중인지(is_active=True) 확인함
            raise serializers.ValidationError("종료된 라운드에는 투표할 수 없습니다.")

        if BalanceVote.objects.filter(question=q, user=user).exists(): # 이미 투표한 문항인지 확인 (중복 방지)
            raise serializers.ValidationError("이미 이 문항에 투표했습니다.")

        attrs["question_obj"] = q
        attrs["user_obj"] = user
        return attrs
    
    @transaction.atomic # 트랜잭션 처리(하나의 묶음으로 처리) 만약 중간에 오류가 나면 모두 롤백
    def create(self, validated_data): # 검증을 모두 통과한 데이터를 db에 저장
        q: BalanceQuestion = validated_data["question_obj"]
        user = validated_data["user_obj"]
        choice = validated_data["choice"]

# 1인 1표 (동시성은 DB의 유니크 제약조건으로 처리)
        try:
            vote = BalanceVote.objects.create(question=q, user=user, choice=choice)
        except IntegrityError: # validate를 통과한 극한의 요청일 경우를 위한 예외처리
            raise serializers.ValidationError("이미 이 문항에 투표했습니다.")

# 실시간 집계 반영 (F 표현식 사용)
        if choice == BalanceVote.Choice.A: #데이터베이스에 직접 접근하여 카운트를 증가한 값으로 업데이트 해주는 SQL쿼리 생성 해주는
            BalanceQuestion.objects.filter(pk=q.pk).update(vote_a_count=F("vote_a_count") + 1)
        else:
            BalanceQuestion.objects.filter(pk=q.pk).update(vote_b_count=F("vote_b_count") + 1)

        return vote
    