import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import SocialAccount
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from signup.serializers import (
    KakaoLoginRequestSerializer,
    UserSignupSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


# -------------------------
# 일반 로그인
# -------------------------
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
                {"detail": "로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except InvalidToken:
            return Response(
                {"detail": "로그인 실패: 잘못된 요청입니다."},
                status=status.HTTP_401_UNAUTHORIZED
            )


# -------------------------
# 일반 회원가입
# -------------------------
class UserSignupAPIView(APIView):
    """일반 회원가입 뷰"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response(
                {
                    "access": str(access),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "name": user.name,
                        "email": user.email,
                        "phone": user.phone,
                        "school": user.school,
                        "student_card_image": (
                            request.build_absolute_uri(user.student_card_image.url)
                            if user.student_card_image else None
                        ),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------
# 테스트용 callback 디버그
# -------------------------
def kakao_callback_debug(request):
    code = request.GET.get("code", "")
    error = request.GET.get("error", "")
    return HttpResponse(f"code={code}<br>error={error}")


# -------------------------
# 카카오 로그인
# -------------------------
class KakaoLoginAPIView(APIView):
    """카카오 로그인 뷰"""
    permission_classes = [AllowAny]

    def post(self, request):
        # 요청 값 검증
        in_ser = KakaoLoginRequestSerializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        code = in_ser.validated_data["code"]

        # 1) code -> access_token
        token_url = "https://kauth.kakao.com/oauth/token"
        data = {
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_REST_API_KEY,
            "redirect_uri": settings.KAKAO_ALLOWED_REDIRECT_URIS[0],  # 운영 환경 고정값
            "code": code,
        }

        print("KAKAO TOKEN REQ >>>", data)  # 실제 요청 값 확인용 로그

        if getattr(settings, "KAKAO_CLIENT_SECRET", ""):
            data["client_secret"] = settings.KAKAO_CLIENT_SECRET

        try:
            t = requests.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
                timeout=7,
            )
            t.raise_for_status()
            access_token = t.json().get("access_token")
            if not access_token:
                return Response({"detail": "카카오 토큰 발급 실패"}, status=502)
        except requests.RequestException as e:
            print("KAKAO TOKEN ERROR >>>", e)
            return Response({"detail": "카카오 로그인 처리 중 오류가 발생했습니다."}, status=502)

        # 2) access_token -> profile
        try:
            me = requests.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=7,
            )
            me.raise_for_status()
            payload = me.json()
        except requests.RequestException as e:
            print("KAKAO USERINFO ERROR >>>", e)
            return Response({"detail": "카카오 로그인 처리 중 오류가 발생했습니다."}, status=502)

        kakao_id = payload.get("id")
        account = (payload.get("kakao_account") or {})
        profile = (account.get("profile") or {})
        email = account.get("email")
        nickname = profile.get("nickname") or f"kakao_{kakao_id}"

        if not kakao_id:
            return Response({"detail": "잘못된 카카오 응답"}, status=400)

        try:
            with transaction.atomic():
                # 3) 소셜 계정 먼저 조회
                sa = SocialAccount.objects.filter(
                    provider="kakao", social_id=str(kakao_id)
                ).select_related("user").first()

                if sa:
                    user = sa.user
                    print(f"[KAKAO LOGIN] 기존 소셜 계정 사용: kakao_id={kakao_id}, user_id={user.id}")
                else:
                    # 이메일로 기존 유저 찾기
                    user = None
                    if email:
                        user = User.objects.filter(email=email).first()

                    # 없으면 새 유저 생성
                    if not user:
                        base_username = nickname
                        final_username = base_username
                        counter = 1
                        while User.objects.filter(username=final_username).exists():
                            final_username = f"{base_username}_{counter}"
                            counter += 1

                        user = User.objects.create(
                            username=final_username,
                            email=email or "",
                            name=nickname,
                            points=10000,
                        )
                        user.set_unusable_password()
                        user.save()
                        print(f"[KAKAO LOGIN] 새 유저 생성: id={user.id}, username={user.username}")
                    else:
                        print(f"[KAKAO LOGIN] 기존 이메일 유저 사용: id={user.id}, email={user.email}")

                    # 소셜 계정 신규 연결 (중복 방지)
                    sa, created = SocialAccount.objects.get_or_create(
                        user=user, provider="kakao", social_id=str(kakao_id)
                    )
                    if created:
                        print(f"[KAKAO LOGIN] ✅ 새 소셜 계정 연결 완료: kakao_id={kakao_id}, user_id={user.id}")
                    else:
                        print(f"[KAKAO LOGIN] ℹ️ 기존 소셜 계정 그대로 사용: kakao_id={kakao_id}, user_id={user.id}")

            # 4) JWT 발급
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            out = {
                "access": str(access),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,     # 로그인 아이디
                    "name": user.name,             # 이름
                    "profile_image": user.profile_image.url if user.profile_image else None,
                    "intro": user.intro or "",     # 한줄소개
                    "points": user.points,
                    "warnings": user.warnings,
                },
            }
            print(f"[KAKAO LOGIN] 🎟️ JWT 발급 완료: user_id={user.id}")
            return Response(out, status=200)

        except Exception as e:
            import traceback
            print("KAKAO LOGIN ERROR >>>", e)
            print(traceback.format_exc())
            return Response({"detail": "카카오 로그인 처리 중 오류가 발생했습니다."}, status=500)
