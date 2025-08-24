from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.templatetags.static import static

class Place(models.Model): # 장소에 대한 기본 정보 저장
    name = models.CharField(max_length=30)
    address = models.CharField(max_length=50, default="", blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    capacity = models.PositiveIntegerField(default=1)
    photo = models.ImageField(upload_to="places/", blank=True, null=True)
    map = models.ImageField(upload_to="maps/", blank=False, null=False)

    # 정적 지도 이미지 기준 정규화 좌표
    x_norm = models.FloatField(default=0.5, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    y_norm = models.FloatField(default=0.5, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])

    def __str__(self): return self.name

    def get_photo_url(self):
        if self.photo:  # 업로드된 경우
            return self.photo.url
        # 디폴트 static 이미지
        return static("places/default_party.jpg")

class Tag(models.Model): # 파티에 대해 생성/ 생성 가능한 태그값들 저장
    name = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name

class Party(models.Model): # AI와 Place를 연결하여 랜덤으로 파티 생성
    place = models.ForeignKey(Place, on_delete=models.PROTECT, related_name="parties")
    tags = models.ManyToManyField(Tag, related_name="parties", blank=True) #tag 추가
    title = models.CharField(max_length=50)
    description = models.TextField(default="") # 파티에 대한 설명
    max_participants = models.PositiveIntegerField(default=4)
    deposit = models.PositiveIntegerField("예약금", default=0)
    start_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True) # created_at을 기준으로 start_time이 더 이후여야 함
    is_approved = models.BooleanField(default=True)  # 해커톤에선 기본 True
    is_cancelled = models.BooleanField(default=False)  # ✅ 취소 여부
    
    def __str__(self): return f"{self.title} @ {self.place.name}"


class Participation(models.Model): # 개별 파티마다의 참여자 저장
    class Status(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT", "결제 대기"
        CONFIRMED = "CONFIRMED", "참가 확정"
        CANCELED = "CANCELED", "참가 취소"

    party = models.ForeignKey(Party, on_delete=models.CASCADE, related_name="participations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="party_participations")
    is_standby = models.BooleanField(default=False) # 파티 보조 화면에서 게임 참여 on-off 관리
    status = models.CharField("상태", max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT) # 결제 대기 상태로 시작
    created_at = models.DateTimeField(auto_now_add=True) # 참여 신청 시각 (이걸기반으로 결제 대기 시간 제한)
    paid_at = models.DateTimeField("결제일시", null=True, blank=True) # 결제 완료 시각

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['party', 'user'], name='unique_participation_per_party')
        ]
        