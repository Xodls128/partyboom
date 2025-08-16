from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
    party = models.ForeignKey('detailview.Party', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    q1_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q2_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    q3_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('party', 'user')
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else "탈퇴 유저"
        party_str = self.party.title if self.party else "삭제된 파티"
        return f"{user_str} - {party_str} 리뷰"


REPORT_CATEGORIES = [
    ('FAKE_INFO', '개인정보 허위 기재'),
    ('UNPLEASANT', '파티 현장에서의 불쾌감 형성'),
    ('INAPPROPRIATE_ACT', '파티 현장에서의 부적절한 행위'),
    ('BAD_PHOTO', '부적절한 프로필 사진'),
    ('OTHER', '기타'),
]

class Report(models.Model):
    party = models.ForeignKey('detailview.Party', on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_made')
    reported_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_received')
    category = models.CharField(max_length=30, choices=REPORT_CATEGORIES)
    content = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='pending')  # 처리 상태 - 우리 측에서 처리했는지 여부 저장
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('party', 'reporter', 'reported_user')
        ordering = ['-created_at']

    def __str__(self):
        reporter_str = self.reporter.username if self.reporter else "탈퇴 유저"
        reported_str = self.reported_user.username if self.reported_user else "탈퇴 유저"
        return f"{reporter_str} -> {reported_str} ({self.category})"
    

class ExtraSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='extra_setting')
    grade = models.CharField(max_length=20, blank=True)
    college = models.CharField(max_length=50, blank=True)
    personality = models.CharField(max_length=20, blank=True)
    mbti_i_e = models.CharField(max_length=1, blank=True)
    mbti_n_s = models.CharField(max_length=1, blank=True)
    mbti_f_t = models.CharField(max_length=1, blank=True)
    mbti_p_j = models.CharField(max_length=1, blank=True)

    def __str__(self):
        return f"{self.user.username if self.user else '탈퇴 유저'}의 추가 설정"
    