from django.urls import path
from .views import ReserveJoinView, ReservePayView, ParticipationDetailView

app_name = "reserve"

urlpatterns = [
    path("join/<int:party_id>/", ReserveJoinView.as_view(), name="reserve-join"),
    path("pay/<int:participation_id>/", ReservePayView.as_view(), name="reserve-pay"),
    path("participation/<int:pk>/", ParticipationDetailView.as_view(), name="participation-detail"),
]