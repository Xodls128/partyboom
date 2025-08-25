from django.db import models
import uuid
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

class BalanceRound(models.Model):
    """한 파티당 하나만 존재하는 밸런스게임 라운드"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    party = models.OneToOneField(  # OneToOne으로 파티당 하나만
        "detailview.Party",
        on_delete=models.CASCADE,
        related_name="balance_round",
        verbose_name="파티",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="created_balance_rounds",
    )
    model_used = models.CharField("사용 모델", max_length=40, default="gpt-4o-mini")
    is_active = models.BooleanField("진행 중", default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.party.title} 파티 라운드"


class BalanceQuestion(models.Model):
    """라운드에 포함된 개별 문항"""
    round = models.ForeignKey(
        BalanceRound, on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="라운드",
    )
    order = models.PositiveIntegerField("표시 순서", default=1)
    a_text = models.CharField("선택지 A", max_length=80)
    b_text = models.CharField("선택지 B", max_length=80)
    vote_a_count = models.PositiveIntegerField(default=0)
    vote_b_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("round", "order")
        ordering = ["order"]

    def __str__(self):
        return f"[{self.order}] {self.a_text} vs {self.b_text}"


class BalanceVote(models.Model):
    """문항별 투표 기록 (1인 1표)"""
    class Choice(models.TextChoices):
        A = "A", "A"
        B = "B", "B"

    question = models.ForeignKey(
        BalanceQuestion, on_delete=models.CASCADE,
        related_name="votes", verbose_name="문항",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="balance_votes", verbose_name="사용자",
    )
    choice = models.CharField("선택", max_length=1, choices=Choice.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("question", "user")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id} -> Q{self.question_id} ({self.choice})"

class RoundState(models.Model):
    """밸런스 게임 라운드의 상태를 추적 (롱폴링용)"""
    round = models.OneToOneField(
        BalanceRound,
        on_delete=models.CASCADE,
        related_name="state",
        verbose_name="라운드",
    )
    version = models.PositiveIntegerField("상태 버전", default=1)
    last_updated = models.DateTimeField("최종 업데이트", auto_now=True)

    def __str__(self):
        return f"{self.round_id} - Version {self.version}"

@receiver(post_save, sender=BalanceRound)
def create_round_state(sender, instance, created, **kwargs):
    if created:
        RoundState.objects.create(round=instance)