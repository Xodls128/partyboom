# partyassist/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyPartyViewSet, StandbyViewSet, PartyWaitStateView

router = DefaultRouter()
router.register(r'myparties', MyPartyViewSet, basename='myparty')
router.register(r'standby', StandbyViewSet, basename='standby')

urlpatterns = [
    path("", include(router.urls)),
    path("wait-state/<int:party_id>/", PartyWaitStateView.as_view(), name="party-wait-state"),
]