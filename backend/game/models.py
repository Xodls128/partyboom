from django.db import models
import uuid
from django.conf import settings

class BalanceRound(models.Model):
    """
    밸런스 게임 한 '라운드'(AI가 생성한 문항 묶음).
    - 프론트는 이 round를 구독(폴링/웹소켓)하며 실시간 집계를 본다.
    """
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    party = models.ForeignKey("detailview.Party", on_delete=models.CASCADE, related_name="balance_rounds", verbose_name="파티")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_balance_rounds"
    )
    model_used = models.CharField("사용 모델", max_length=40, default="gpt-4o-mini")

    # 안전성/운영 플래그
    safety_blocked = models.BooleanField("안전성 차단", default=False)
    safety_reason = models.CharField("차단 사유", max_length=120, blank=True, default="")
    is_active = models.BooleanField("진행 중", default=True)  # 닫으면 집계만 조회

    # 타임스탬프
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.party.title}파티의 밸런스 게임"


class BalanceQuestion(models.Model):
    """
    라운드에 포함된 개별 문항(A vs B).
    - 실시간 집계를 위해 denormalized 카운터를 보유(vote_a_count, vote_b_count).
    """
    round = models.ForeignKey(
        BalanceRound, on_delete=models.CASCADE, related_name="questions", verbose_name="라운드"
    )
    order = models.PositiveIntegerField("표시 순서", default=1)

    a_text = models.CharField("선택지 A", max_length=80)
    b_text = models.CharField("선택지 B", max_length=80)

    vote_a_count = models.PositiveIntegerField("A 득표", default=0)
    vote_b_count = models.PositiveIntegerField("B 득표", default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["round", "order"], name="uniq_round_order"),
        ]
        indexes = [
            models.Index(fields=["round", "order"]),
        ]
        ordering = ["round", "order"]

    def __str__(self):
        return f"[{self.order}] {self.a_text} vs {self.b_text}"


class BalanceVote(models.Model):
    """
    사용자 투표 기록. 1인 1표(문항별).
    - 집계는 BalanceQuestion의 카운터를 증가(F 표현식)시켜서 즉시 반영.
    """
    class Choice(models.TextChoices):
        A = "A", "A"
        B = "B", "B"

    question = models.ForeignKey(
        BalanceQuestion, on_delete=models.CASCADE, related_name="votes", verbose_name="문항"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="balance_votes", verbose_name="사용자"
    )
    choice = models.CharField("선택", max_length=1, choices=Choice.choices)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["question", "user"], name="uniq_vote_per_user_question"),
        ]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["question"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id} -> Q{self.question_id} ({self.choice})"
