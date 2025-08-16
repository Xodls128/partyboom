from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

class Place(models.Model): # 장소에 대한 기본 정보 저장
    name = models.CharField(max_length=30)
    address = models.CharField(max_length=50, default="", blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    capacity = models.PositiveIntegerField(default=1)
    photo = models.ImageField(upload_to="places/", default="places/default_party.jpg")

    # 정적 지도 이미지 기준 정규화 좌표
    x_norm = models.FloatField(default=0.5, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    y_norm = models.FloatField(default=0.5, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])

    def __str__(self): return self.name

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
    start_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True) # created_at을 기준으로 start_time이 더 이후여야 함
    is_approved = models.BooleanField(default=True)  # 해커톤에선 기본 True
    
    def __str__(self): return f"{self.title} @ {self.place.name}"


class Participation(models.Model): # 개별 파티마다의 참여자 저장
    party = models.ForeignKey(Party, on_delete=models.CASCADE, related_name="participations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="party_participations")

    class Meta:
        unique_together = ("party", "user")  # 중복 신청 방지
