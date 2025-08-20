from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import NoticeViewSet, notice_stream

router = DefaultRouter()
router.register(r"", NoticeViewSet, basename="notice")

urlpatterns = router.urls 
