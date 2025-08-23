from rest_framework import serializers
from detailview.models import Party, Participation
from mypage.models import ExtraSetting
from django.contrib.auth import get_user_model
from mypage.models import Report

User = get_user_model()

class ExtraSettingSerializer(serializers.ModelSerializer):
    mbti = serializers.SerializerMethodField()

    class Meta:
        model = ExtraSetting
        fields = ["grade", "college", "personality", "mbti"]

    def get_mbti(self, obj):
        # 네 필드 합쳐서 "ENFP" 같은 문자열로 반환
        return f"{obj.mbti_i_e}{obj.mbti_n_s}{obj.mbti_f_t}{obj.mbti_p_j}".upper()

class UserProfileSerializer(serializers.ModelSerializer):
    extra_setting = ExtraSettingSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "profile_image",
            "intro",
            "extra_setting"  # 추가 설정 정보 포함
        ]


class PartyParticipantSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    is_reported = serializers.SerializerMethodField()

    class Meta:
        model = Participation
        fields = ["id", "user", "is_standby", "is_reported"]

    def get_is_reported(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Report.objects.filter(
                party=obj.party,           # ✅ 해당 파티에서
                reporter=request.user,     # ✅ 내가 신고했고
                reported_user=obj.user     # ✅ 이 유저가 대상이면
            ).exists()
        return False
        
        

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "profile_image"]  # User 모델에 profile_image 필드 있다고 가정
        

class MyPartySerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    participation_count = serializers.SerializerMethodField()

    # ForeignKey → Place 모델 필드 꺼내오기
    place_name = serializers.CharField(source="place.name", read_only=True)
    place_photo = serializers.ImageField(source="place.photo", read_only=True)
    place_x_norm = serializers.FloatField(source="place.x_norm", read_only=True)
    place_y_norm = serializers.FloatField(source="place.y_norm", read_only=True)

    class Meta:
        model = Party
        fields = [
            "id",
            "title",
            "description",
            "place_name",        # ✅ place.name
            "place_photo",       # ✅ place.photo
            "place_x_norm",      # ✅ place.x_norm
            "place_y_norm",      # ✅ place.y_norm
            "start_time",
            "max_participants",
            "participation_count",
            "participants",
        ]

    def get_participation_count(self, obj):
        return obj.participations.count()

    def get_participants(self, obj):
        qs = obj.participations.select_related("user")[:5]
        return UserProfileSerializer([p.user for p in qs], many=True).data  
    