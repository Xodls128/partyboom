from django.urls import path
from .views import RoundRetrieveView, VoteCreateView, ActiveRoundCheckView

app_name = "game"

urlpatterns = [
    # 특정 라운드 조회
    path("rounds/<uuid:round_id>/", RoundRetrieveView.as_view(), name="round-retrieve"),

    # 특정 문항에 투표
    path("questions/<int:question_id>/vote/", VoteCreateView.as_view(), name="vote-create"),

    # 특정 파티의 활성 라운드 확인
    path("parties/<int:party_id>/active-round/", ActiveRoundCheckView.as_view(), name="active-round-check"),
]
