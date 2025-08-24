import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError
from users.models import SocialAccount
from signup.serializers import (
    KakaoLoginRequestSerializer,
    UserSignupSerializer,
    CustomTokenObtainPairSerializer,
)
from django.templatetags.static import static
from django.db import IntegrityError


User = get_user_model()


class CustomLoginAPIView(TokenObtainPairView):
    """일반 로그인 뷰"""
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            response.data["detail"] = "로그인 성공"
            return response
        except TokenError:
            return Response(
                {"detail": "아이디 또는 비밀번호가 올바르지 않습니다."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class UserSignupAPIView(APIView):
    """회원가입 뷰"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response(
            {
                "refresh": str(refresh),
                "access": str(access),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "name": user.name,
                    "points": user.points,
                },
            },
            status=201,
        )


class KakaoLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = KakaoLoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]
        redirect_uri = serializer.validated_data["redirect_uri"]

        try:
            # 1) 토큰 교환
            token_url = "https://kauth.kakao.com/oauth/token"
            data = {
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_REST_API_KEY,
                "redirect_uri": redirect_uri,
                "code": code,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
            }
            token_res = requests.post(token_url, data=data)
            token_res.raise_for_status()
            access_token = token_res.json().get("access_token")

            # 2) 사용자 정보
            profile_url = "https://kapi.kakao.com/v2/user/me"
            headers = {"Authorization": f"Bearer {access_token}"}
            profile_res = requests.get(profile_url, headers=headers)
            profile_res.raise_for_status()
            kakao_profile = profile_res.json()

            kakao_id = kakao_profile.get("id")
            kakao_account = kakao_profile.get("kakao_account", {})
            profile = kakao_account.get("profile")

            if isinstance(profile, dict):
                nickname = profile.get("nickname") or f"user_{kakao_id}"
            else:
                nickname = f"user_{kakao_id}"

            email = kakao_account.get("email")

            # 3) User & SocialAccount 처리
            with transaction.atomic():
                social_account = SocialAccount.objects.filter(
                    provider="kakao", social_id=kakao_id
                ).first()

                if social_account:
                    user = social_account.user
                else:
                    user = User.objects.create(
                        username=f"kakao_{kakao_id}",
                        email=email or f"{kakao_id}@kakao.com",
                        name=nickname,
                        school="국민대",
                    )
                    try:
                        SocialAccount.objects.create(
                            user=user, provider="kakao", social_id=kakao_id
                        )
                    except IntegrityError:
                        pass

            # 4) 토큰 발급
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            # 5) 응답
            profile_image = (
                user.profile_image.url
                if getattr(user, "profile_image", None)
                else "/static/icons/default_profile.png"
            )

            out = {
                "access": str(access),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.name or "",
                    "profile_image": profile_image,
                    "intro": user.intro or "",
                    "school": user.school or "",
                    "points": user.points,
                    "warnings": user.warnings,
                },
            }
            return Response(out, status=200)

        except Exception as e:
            import traceback
            print("KAKAO LOGIN ERROR >>>", e)
            print(traceback.format_exc())
            return Response(
                {"detail": "카카오 로그인 처리 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        