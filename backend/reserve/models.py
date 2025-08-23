from django.db import models
from django.conf import settings

class Payment(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "결제 성공"
        FAILED = "FAILED", "결제 실패"
        REFUNDED = "REFUNDED", "환불 완료"

    class Method(models.TextChoices):
        POINT = "POINT", "포인트"
        COUPON = "COUPON", "쿠폰"
        CARD = "CARD", "카드결제"

    participation = models.OneToOneField(
        "detailview.Participation", 
        on_delete=models.PROTECT,
        related_name="payment"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments"
    )
    amount = models.PositiveIntegerField("결제 금액")
    status = models.CharField("상태", max_length=20, choices=Status.choices)
    method = models.CharField("결제 방법", max_length=20, choices=Method.choices, default=Method.POINT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user}의 {self.amount}원 결제 ({self.get_method_display()} - {self.status})"
    