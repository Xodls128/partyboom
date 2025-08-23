from rest_framework import serializers
from .models import Review, Report, ExtraSetting
from detailview.models import Participation  # 파티 참여 테이블
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'party', 'user', 'q1_rating', 'q2_rating', 'q3_rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']

    def validate(self, data):
        user = self.context['request'].user
        party = data.get('party')

        # 1. 파티 참여 여부 확인
        if not Participation.objects.filter(user=user, party=party).exists():
            raise serializers.ValidationError("참여한 파티에만 리뷰를 작성할 수 있습니다.")

        # 2. 중복 작성 방지
        if Review.objects.filter(user=user, party=party).exists():
            raise serializers.ValidationError("이미 이 파티에 리뷰를 작성하셨습니다.")

        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'party', 'reporter', 'reported_user', 'category', 'content', 'status', 'created_at']
        read_only_fields = ['id', 'reporter', 'status', 'created_at']

    def validate(self, data):
        reporter = self.context['request'].user
        reported_user = data.get('reported_user')
        party = data.get('party')

        # 1. 파티 참여 여부 확인
        if not Participation.objects.filter(user=reporter, party=party).exists():
            raise serializers.ValidationError("참여한 파티에서만 신고가 가능합니다.")

        # 2. 자기 자신 신고 방지
        if reporter == reported_user:
            raise serializers.ValidationError("자기 자신은 신고할 수 없습니다.")

        # 3. 중복 신고 방지
        if Report.objects.filter(party=party, reporter=reporter, reported_user=reported_user).exists():
            raise serializers.ValidationError("이미 해당 유저를 신고하셨습니다.")

        return data

    def create(self, validated_data):
        reporter = self.context['request'].user
        validated_data['reporter'] = reporter
        report = super().create(validated_data)

        # 신고당한 유저 warnings +1
        reported_user = report.reported_user
        if reported_user:
            reported_user.warnings = reported_user.warnings + 1
            reported_user.save(update_fields=["warnings"])

        return report
    

class ExtraSettingFromJsonSerializer(serializers.Serializer):
    extra = serializers.DictField()

    def create(self, validated_data): #json의 키값들 확인 후 변경될 텍스트들 (현재는 임시로)
        extra_data = validated_data.get('extra', {})
        return ExtraSetting.objects.create(
            user=self.context['request'].user,
            grade=extra_data.get('grade', ''),  
            college=extra_data.get('college', ''),
            personality=extra_data.get('personality', ''),
            mbti_i_e=extra_data.get('mbti', {}).get('i_e', ''),
            mbti_n_s=extra_data.get('mbti', {}).get('n_s', ''),
            mbti_f_t=extra_data.get('mbti', {}).get('f_t', ''),
            mbti_p_j=extra_data.get('mbti', {}).get('p_j', ''),
        )

    def update(self, instance, validated_data):
        extra_data = validated_data.get('extra', {})
        instance.grade = extra_data.get('grade', instance.grade)
        instance.college = extra_data.get('college', instance.college)
        instance.personality = extra_data.get('personality', instance.personality)
        instance.mbti_i_e = extra_data.get('mbti', {}).get('i_e', instance.mbti_i_e)
        instance.mbti_n_s = extra_data.get('mbti', {}).get('n_s', instance.mbti_n_s)
        instance.mbti_f_t = extra_data.get('mbti', {}).get('f_t', instance.mbti_f_t)
        instance.mbti_p_j = extra_data.get('mbti', {}).get('p_j', instance.mbti_p_j)
        instance.save()
        return instance


class ProfileUpdateSerializer(serializers.ModelSerializer):
    # 비밀번호 변경 필드
    new_password = serializers.CharField(write_only=True, required=False)
    new_password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['profile_image', 'intro', 'new_password', 'new_password_confirm']
        read_only_fields = []  # 모두 수정 가능

    def validate(self, attrs):
        # 비밀번호 변경 요청이 있을 경우
        new_pw = attrs.get('new_password')
        new_pw_confirm = attrs.get('new_password_confirm')

        if new_pw or new_pw_confirm:
            if new_pw != new_pw_confirm:
                raise serializers.ValidationError({"new_password_confirm": "비밀번호가 일치하지 않습니다."})
            validate_password(new_pw)

        return attrs

    def update(self, instance, validated_data):
        # 비밀번호 변경
        new_pw = validated_data.pop('new_password', None)
        validated_data.pop('new_password_confirm', None)

        if new_pw:
            instance.set_password(new_pw)

        # 나머지 필드 업데이트 (프로필 사진, 한줄소개)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
    
    