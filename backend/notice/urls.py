from rest_framework.routers import DefaultRouter
from django.urls import path
from notice.views import NoticeViewSet

router = DefaultRouter()
router.register(r"", NoticeViewSet, basename="notice")

urlpatterns = router.urls 
