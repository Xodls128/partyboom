from django.urls import path
from .views import ReserveJoinView, ReservePayView

app_name = "reserve"

urlpatterns = [
    path("join/<int:party_id>/", ReserveJoinView.as_view(), name="reserve-join"),
    path("pay/<int:participation_id>/", ReservePayView.as_view(), name="reserve-pay"),
]