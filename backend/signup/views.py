import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError
from django.utils.text import slugify

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

User = get_user_model()


# --------- 유틸 ---------
def _unique_username(base: str) -> str:
    """
    닉네임/기본값을 바탕으로 중복되지 않는 username 생성
    """
    base = (slugify(base) or "user")[:18]
    candidate = base or "user"
    i = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{base}{i:02d}"
        i += 1
    return candidate


# --------- 일반 로그인 ---------
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


# --------- 회원가입 ---------
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


# --------- 카카오 로그인/회원가입(아이템포턴트) ---------
class KakaoLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = KakaoLoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]
        redirect_uri = serializer.validated_data["redirect_uri"]

        # 1) 카카오 토큰 교환
        try:
            token_res = requests.post(
                "https://kauth.kakao.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": settings.KAKAO_REST_API_KEY,
                    "client_secret": settings.KAKAO_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
                timeout=7,
            )
            token_res.raise_for_status()
            kakao_access = token_res.json().get("access_token")
            if not kakao_access:
                return Response({"detail": "카카오 엑세스 토큰이 없습니다."}, status=502)
        except requests.RequestException:
            return Response({"detail": "카카오 토큰 교환 실패"}, status=502)

        # 2) 카카오 사용자 정보
        try:
            me = requests.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {kakao_access}"},
                timeout=7,
            )
            me.raise_for_status()
            prof = me.json()
        except requests.RequestException:
            return Response({"detail": "카카오 사용자 정보 조회 실패"}, status=502)

        kakao_id = str(prof.get("id") or "")
        if not kakao_id:
            return Response({"detail": "유효하지 않은 카카오 ID"}, status=400)

        kakao_account = prof.get("kakao_account", {}) or {}
        profile = kakao_account.get("profile", {}) or {}
        nickname = profile.get("nickname") or f"k_{kakao_id[-6:]}"
        email = kakao_account.get("email")  # 동의 거부 시 None

        # 3) User & SocialAccount 처리 (아이템포턴트)
        try:
            with transaction.atomic():
                # 이미 연결된 소셜계정?
                try:
                    sa = SocialAccount.objects.select_for_update().get(
                        provider="kakao", social_id=kakao_id
                    )
                    user = sa.user
                except SocialAccount.DoesNotExist:
                    # 같은 이메일의 기존 유저가 있으면 연결 (중복 계정 방지)
                    user = None
                    if email:
                        user = User.objects.filter(email=email).first()

                    if not user:
                        # 새 유저 생성 (username 중복 회피)
                        username = _unique_username(nickname or f"k_{kakao_id[-6:]}")
                        # email은 동의 거부 시 None으로 (빈 문자열은 unique 충돌 유발 가능)
                        user = User.objects.create(
                            username=username,
                            email=email if email else None,
                            name=nickname,
                        )

                    # 소셜 계정 생성 (레이스 컨디션 대비 get_or_create)
                    try:
                        sa, _ = SocialAccount.objects.get_or_create(
                            provider="kakao",
                            social_id=kakao_id,
                            defaults={"user": user},
                        )
                        user = sa.user
                    except IntegrityError:
                        # 동시에 요청 온 경우: 다시 조회
                        sa = SocialAccount.objects.get(provider="kakao", social_id=kakao_id)
                        user = sa.user

        except Exception as e:
            # 예상치 못한 DB 오류
            return Response({"detail": "서버 오류로 로그인에 실패했습니다."}, status=500)

        # 4) JWT 토큰 발급
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # 5) 응답 페이로드
        #   - 추가정보 제공 여부는 프로젝트 스키마에 맞춰 조절 (예: extra_setting 존재 여부)
        is_additional_info_provided = bool(getattr(user, "extra_setting", None))

        # 프로필 이미지 URL (User.get_photo_url()이 있으면 그걸 쓰는 것도 가능)
        try:
            profile_image = user.profile_image.url if getattr(user, "profile_image", None) else "/static/icons/default_profile.png"
        except Exception:
            profile_image = "/static/icons/default_profile.png"

        out = {
            "access": str(access),
            "refresh": str(refresh),
            "is_additional_info_provided": is_additional_info_provided,
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
