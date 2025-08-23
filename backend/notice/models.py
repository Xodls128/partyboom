from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notice(models.Model):
    PARTY_OPEN_1DAY = "party_open_1day"
    PARTY_INSUFFICIENT = "party_insufficient"
    PARTY_NEW = "party_new"
    PARTY_APPLIED = "party_applied"
    PARTY_CANCELED = "party_canceled"

    NOTICE_TYPES = [
        (PARTY_OPEN_1DAY, "파티 오픈 1일 전"),
        (PARTY_INSUFFICIENT, "인원 미달 오픈 1일 전"),
        (PARTY_NEW, "새 파티 생성"),
        (PARTY_APPLIED, "파티 신청 완료"),
        (PARTY_CANCELED, "파티 신청 취소"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notices")
    target_party = models.ForeignKey("detailview.Party", on_delete=models.CASCADE, null=True, blank=True, related_name="notices")
    notice_type = models.CharField(max_length=50, choices=NOTICE_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.get_notice_type_display()} ({'읽음' if self.is_read else '안읽음'})"
    