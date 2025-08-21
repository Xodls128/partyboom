from django.conf import settings
from rest_framework import serializers
import re
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer): # 일반 로그인 시 사용
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)

        # 로그인 성공 시 최소한의 user 정보만 내려주기
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "name": self.user.name,
            "email": self.user.email,
        }

        return data
    

class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)  # 비밀번호 확인용

    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="이미 사용 중인 이메일입니다.")]
    )
    phone = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="이미 사용 중인 전화번호입니다.")]
    )

    class Meta:
        model = User
        fields = ["username", "password", "password2", "name", "email", "phone", "school", "student_card_image"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "비밀번호와 비밀번호 확인이 일치하지 않습니다."})
        return data

    def validate_phone(self, value):
        value = value.strip()
        if not re.match(r"^\d+$", value):
            raise serializers.ValidationError("전화번호는 숫자만 입력해야 합니다. (하이픈 '-' 제외)")
        return value

    def create(self, validated_data):
        validated_data.pop("password2")  # 확인용 필드는 DB에 저장할 필요 없음
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
    

class KakaoLoginRequestSerializer(serializers.Serializer):
    code = serializers.CharField()
    redirect_uri = serializers.URLField()

    def validate_redirect_uri(self, value):
        #화이트리스트로 리다이렉트 URI 검증
        allowed = getattr(settings, "KAKAO_ALLOWED_REDIRECT_URIS", [])
        if allowed and value not in allowed:
            raise serializers.ValidationError("redirect_uri mismatch")
        return value

class UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField(allow_blank=True, allow_null=True, required=False)
    name = serializers.CharField(allow_blank=True, required=False)

class TokenPairResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserBriefSerializer()
