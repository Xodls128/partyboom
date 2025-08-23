from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MypageMainViewSet, ReviewViewSet, ReportViewSet, ExtraSettingMeAPIView, ProfileUpdateView

router = DefaultRouter()
router.register(r'main', MypageMainViewSet, basename='main')  # 메인 화면
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', ProfileUpdateView.as_view(), name='mypage-profile-update'),
    path("extra-settings/me/", ExtraSettingMeAPIView.as_view(), name="extra-setting-me"),
]