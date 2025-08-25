from rest_framework import serializers
from detailview.models import Party, Participation
from mypage.models import ExtraSetting, Report
from django.contrib.auth import get_user_model
from game.models import BalanceRound  # 라운드 ID 확인용

User = get_user_model()

class ExtraSettingSerializer(serializers.ModelSerializer):
    mbti = serializers.SerializerMethodField()

    class Meta:
        model = ExtraSetting
        fields = ["grade", "college", "personality", "mbti"]

    def get_mbti(self, obj):
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
            "extra_setting"
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
                party=obj.party,
                reporter=request.user,
                reported_user=obj.user
            ).exists()
        return False

# 롱폴링 응답을 위한 새로운 시리얼라이저
class StandbyStateSerializer(serializers.Serializer):
    version = serializers.IntegerField()
    participation_count = serializers.IntegerField()
    standby_count = serializers.IntegerField()
    active_round_id = serializers.UUIDField(allow_null=True)
    participants = PartyParticipantSerializer(many=True)

    def to_representation(self, instance):
        party = instance
        # 활성화된 라운드 조회
        active_round = BalanceRound.objects.filter(party=party, is_active=True).first()

        # 참여자 목록
        participants_qs = Participation.objects.filter(party=party).select_related("user", "user__extra_setting")

        return {
            "version": party.wait_state.version,
            "participation_count": party.participations.count(),
            "standby_count": party.participations.filter(is_standby=True).count(),
            "active_round_id": active_round.id if active_round else None,
            "participants": PartyParticipantSerializer(participants_qs, many=True, context=self.context).data
        }


class MyPartySerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    participation_count = serializers.SerializerMethodField()
    place_name = serializers.CharField(source="place.name", read_only=True)
    place_photo = serializers.ImageField(source="place.photo", read_only=True)
    place_x_norm = serializers.FloatField(source="place.x_norm", read_only=True)
    place_y_norm = serializers.FloatField(source="place.y_norm", read_only=True)

    class Meta:
        model = Party
        fields = [
            "id", "title", "description",
            "place_name", "place_photo", "place_x_norm", "place_y_norm",
            "start_time", "max_participants",
            "participation_count", "participants",
        ]

    def get_participation_count(self, obj):
        return obj.participations.count()

    def get_participants(self, obj):
        # UserProfileSerializer가 중복 정의되어 있어 하나를 수정합니다.
        # 프로필 이미지와 ID만 필요한 경우를 위해 별도 정의
        class SimpleUserProfileSerializer(serializers.ModelSerializer):
            class Meta:
                model = User
                fields = ["id", "profile_image"]

        qs = obj.participations.select_related("user")[:5]
        return SimpleUserProfileSerializer([p.user for p in qs], many=True).data
    