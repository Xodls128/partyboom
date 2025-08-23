from urllib import request
from rest_framework import serializers
from .models import Party
from django.utils import timezone

class PartyListSerializer(serializers.ModelSerializer):
    place_id = serializers.IntegerField(source="place.id", read_only=True)
    place_name = serializers.CharField(source="place.name", read_only=True) # 장소명
    # 이미지 절대 URL 보장
    place_photo = serializers.SerializerMethodField()
    #뷰에서 annotate하면 그 값을 쓰고, 없으면 fallback
    applied_count = serializers.SerializerMethodField() # 신청인원
    max_participants = serializers.IntegerField(read_only=True) # 신청가능인원
    # 좌표 내려주기
    place_x_norm = serializers.FloatField(source="place.x_norm", read_only=True)
    place_y_norm = serializers.FloatField(source="place.y_norm", read_only=True)

    class Meta:
        model = Party
        fields = (
            "id",
            "title",
            "start_time",
            "place_id",
            "place_name",
            "place_x_norm",
            "place_y_norm",
            "place_photo",
            "applied_count",
            "max_participants",
        )

    def get_place_photo(self, obj):
        request = self.context.get("request")
        url = obj.place.get_photo_url() if obj.place else None
        return request.build_absolute_uri(url) if (request and url) else url



    def get_applied_count(self, obj):
        # 뷰에서 .annotate(applied_count=Count("participations")) 했다면 이미 값이 있음
        val = getattr(obj, "applied_count", None)
        if val is not None:
            return val
        # 없으면 안전 Fallback
        return obj.participations.count()

        
class PartyDetailSerializer(serializers.ModelSerializer): # 추후에 지도이미지(혹은 API)와 유저 프로필도 추가 예정
    place_id = serializers.IntegerField(source="place.id", read_only=True)
    place_photo = serializers.ImageField(source="place.photo", read_only=True)
    place_name = serializers.CharField(source="place.name", read_only=True)
    # 좌표 내려주기
    place_x_norm = serializers.FloatField(source="place.x_norm", read_only=True)
    place_y_norm = serializers.FloatField(source="place.y_norm", read_only=True)

    tags = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )

    applied_count = serializers.SerializerMethodField()

    class Meta:
        model = Party
        fields = (
            "id",
            "title",
            "start_time",
            "description",
            "tags",
            "place_id",
            "place_name",
            "place_x_norm",
            "place_y_norm",
            "place_photo",
            "applied_count",
            "max_participants",
        )
    def get_place_photo(self, obj):
        request = self.context.get("request")
        url = obj.place.get_photo_url() if obj.place else None
        return request.build_absolute_uri(url) if (request and url) else url

    def get_applied_count(self, obj):
        val = getattr(obj, "applied_count", None)
        if val is not None:
            return val
        return obj.participations.count()
    
class PartyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ["place", "tags", "title", "description", "start_time", "max_participants"]

    def validate_start_time(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("시작 시간은 현재보다 이후여야 합니다.")
        return value

