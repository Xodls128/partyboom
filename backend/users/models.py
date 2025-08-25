from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.templatetags.static import static

class User(AbstractUser):
    # 일반 회원가입/카카오 닉네임을 동일 슬롯에 담아 표시 일관성 확보
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

    def get_photo_url(self):
        if self.profile_image:
            return self.profile_image.url
        return static("icons/default_profile.png")

    @property
    def display_name(self) -> str:
        """UI에서 사용할 표기 이름(없으면 username로 폴백)"""
        return self.name or self.username


class SocialAccount(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_accounts",  # 편의상 추가
    )
    provider = models.CharField(max_length=20, default="kakao")
    # 단독 unique 제거: (provider, social_id) 조합으로 유니크 보장
    social_id = models.CharField(max_length=191, db_index=True)  # 인덱싱 효율 위해 길이 조정

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Django 5 권장 방식
        constraints = [
            models.UniqueConstraint(
                fields=("provider", "social_id"),
                name="uniq_provider_social",
            )
        ]
        indexes = [
            models.Index(fields=("provider", "social_id")),
            models.Index(fields=("user",)),
        ]

    def __str__(self):
        return f"{self.provider}:{self.social_id} -> {self.user_id}"
