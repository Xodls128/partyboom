from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    # 일반 회원가입과 카카오 로그인 nickname이 동일하게 저장되도록 할 예정
    name = models.CharField("이름", max_length=50, blank=True, null=True)

    # 연락처
    email = models.EmailField("이메일", unique=True, blank=True, null=True)
    phone = models.CharField("전화번호", max_length=20, unique=True, blank=True, null=True)

    # 학교 및 인증
    school = models.CharField("학교", max_length=100, blank=True, null=True)
    student_card_image = models.ImageField("학생증 사진", upload_to="student_cards/", blank=True, null=True)

    # 프로필
    intro = models.CharField("한줄소개", max_length=255, blank=True, null=True)
    profile_image = models.ImageField("프로필 사진", upload_to="profiles/", blank=True, null=True)

    # 활동 관련
    points = models.PositiveIntegerField("포인트", default=10000)
    warnings = models.PositiveIntegerField("경고 횟수", default=0)

    def __str__(self):
        return self.username or f"user-{self.pk}"


class SocialAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    provider = models.CharField(max_length=20, default="kakao")
    social_id = models.CharField(max_length=255, unique=True, db_index=True)

    class Meta:
        unique_together = ("provider", "social_id")

    def __str__(self):
        return f"{self.provider}:{self.social_id} -> {self.user_id}"
