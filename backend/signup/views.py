import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
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
    TokenPairResponseSerializer,
    UserBriefSerializer, # 이거 왜 정의한 것인지..
    UserSignupSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()

class CustomLoginAPIView(TokenObtainPairView): # 일반 로그인 뷰 구현
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            response.data["detail"] = "로그인 성공"
            return response
        except TokenError as e:
            # JWT에서 인증 실패 시
            return Response({"detail": "로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다."},
                            status=status.HTTP_401_UNAUTHORIZED)
        except InvalidToken as e:
            # 잘못된 토큰 요청 등
            return Response({"detail": "로그인 실패: 잘못된 요청입니다."},
                            status=status.HTTP_401_UNAUTHORIZED)
    

class UserSignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # JWT 토큰 발급
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
                        "student_card_image": request.build_absolute_uri(user.student_card_image.url) if user.student_card_image else None,
                    }
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

#테스트용 뷰        
from django.http import HttpResponse

def kakao_callback_debug(request):
    code = request.GET.get("code", "")
    error = request.GET.get("error", "")
    return HttpResponse(f"code={code}<br>error={error}")

class KakaoLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        in_ser = KakaoLoginRequestSerializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        code = in_ser.validated_data["code"]
        redirect_uri = in_ser.validated_data["redirect_uri"]

        # 1) code -> access_token
        token_url = "https://kauth.kakao.com/oauth/token"
        data = {
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_REST_API_KEY,
            "redirect_uri": redirect_uri,
            "code": code,
        }
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
                return Response({"detail": "no access_token", "raw": t.text}, status=502)
        except requests.RequestException as e:
            return Response({"detail": f"Kakao token error: {e}"}, status=502)

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
            return Response({"detail": f"Kakao userinfo error: {e}"}, status=502)

        kakao_id = payload.get("id")
        account = (payload.get("kakao_account") or {})
        profile = (account.get("profile") or {})
        email = account.get("email")
        nickname = profile.get("nickname") or f"kakao_{kakao_id}"

        if not kakao_id:
            return Response({"detail": "invalid kakao payload"}, status=400)

        # 3) upsert user + social account
        try:
            with transaction.atomic():
                user = None
                if email:
                    user = User.objects.filter(email=email).first()

                if not user:
                    # username = nickname (중복 방지 처리)
                    base_username = nickname
                    final_username = base_username
                    counter = 1
                    while User.objects.filter(username=final_username).exists():
                        final_username = f"{base_username}_{counter}"
                        counter += 1

                    user, created = User.objects.get_or_create(
                        username=final_username,
                        defaults={
                            "email": email or "",
                            "name": nickname,
                            "points": 10000,
                        }
                    )
                    if created:
                        user.set_unusable_password()
                        user.save()
                        print(f"[KAKAO LOGIN] ✅ 새 유저 생성됨: id={user.id}, username={user.username}")
                    else:
                        print(f"[KAKAO LOGIN] ⚠️ 이미 존재하는 유저 불러옴: id={user.id}, username={user.username}")
                else:
                    # 기존 유저 → 포인트 유지, 닉네임만 보정
                    if not user.name and nickname:
                        user.name = nickname
                        user.save()
                        print(f"[KAKAO LOGIN] ℹ️ 기존 유저 닉네임 업데이트: id={user.id}, name={user.name}")

                # 소셜 계정 연결
                sa, sa_created = SocialAccount.objects.get_or_create(
                    user=user, provider="kakao", social_id=str(kakao_id)
                )
                if sa_created:
                    print(f"[KAKAO LOGIN] ✅ 소셜 계정 연결됨: kakao_id={kakao_id}, user_id={user.id}")
                else:
                    print(f"[KAKAO LOGIN] ℹ️ 기존 소셜 계정 사용: kakao_id={kakao_id}, user_id={user.id}")

            # ✅ 안전장치: 실제 DB에 유저가 존재하는지 확인
            if not user or not User.objects.filter(pk=user.pk).exists():
                print("[KAKAO LOGIN] ❌ User 생성 실패 - DB에 없음")
                return Response({"detail": "User creation failed"}, status=500)

        except Exception as e:
            import traceback
            print("KAKAO LOGIN ERROR >>>", e)
            print(traceback.format_exc())
            return Response({"detail": f"user upsert error: {e}"}, status=500)

        # 4) issue JWT (유저가 확실히 DB에 있는 경우에만)
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        out = {
            "access": str(access),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "email": user.email,
                "points": user.points,
            }
        }
        print(f"[KAKAO LOGIN] 🎟️ JWT 발급 완료: user_id={user.id}, access={access}")
        return Response(TokenPairResponseSerializer(out).data, status=200)
