from django.urls import path
from detailview.views import PartyViewSet  # deatailview와 같은 뷰 사용

app_name = "homemap"

urlpatterns = [
    path("home/", PartyViewSet.as_view({"get": "list"}), name="home-parties"),
    path("map/",  PartyViewSet.as_view({"get": "list"}), name="map-parties"),
]
