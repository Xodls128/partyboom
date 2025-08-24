from urllib import request
from rest_framework import serializers
from .models import Party, Tag # Tag 모델 import 추가
from django.utils import timezone

# --- Tag 시리얼라이저 추가 (PartyListSerializer와 PartyDetailSerializer가 함께 사용) ---
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name")

class PartyListSerializer(serializers.ModelSerializer):
    place_id = serializers.IntegerField(source="place.id", read_only=True)
    place_name = serializers.CharField(source="place.name", read_only=True)
    place_photo = serializers.SerializerMethodField()
    applied_count = serializers.SerializerMethodField()
    max_participants = serializers.IntegerField(read_only=True)
    place_x_norm = serializers.FloatField(source="place.x_norm", read_only=True)
    place_y_norm = serializers.FloatField(source="place.y_norm", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

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
            "tags",
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

        
class PartyDetailSerializer(serializers.ModelSerializer):
    place_id = serializers.IntegerField(source="place.id", read_only=True)
    place_photo = serializers.ImageField(source="place.photo", read_only=True)
    place_name = serializers.CharField(source="place.name", read_only=True)
    place_x_norm = serializers.FloatField(source="place.x_norm", read_only=True)
    place_y_norm = serializers.FloatField(source="place.y_norm", read_only=True)
    place_map = serializers.ImageField(source="place.map", read_only=True)
    # --- SlugRelatedField를 TagSerializer로 변경 ---
    tags = TagSerializer(many=True, read_only=True)
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
            'place_map',
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