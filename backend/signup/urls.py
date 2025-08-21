from django.urls import path
from .views import CustomLoginAPIView, KakaoLoginAPIView, UserSignupAPIView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("auth/signup/", UserSignupAPIView.as_view(), name="signup"),   # 일반 회원가입
    path("auth/login/", CustomLoginAPIView.as_view(), name="login"),   # 일반 로그인
    path("auth/kakao/", KakaoLoginAPIView.as_view(), name="kakao-login"), # 카카오 로그인
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]