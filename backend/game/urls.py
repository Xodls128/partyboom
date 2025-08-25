from django.urls import path
from .views import RoundRetrieveView, VoteCreateView, ActiveRoundCheckView, RoundPollView

app_name = "game"

urlpatterns = [
    # 특정 라운드 조회
    path("rounds/<uuid:round_id>/", RoundRetrieveView.as_view(), name="round-retrieve"),
    
    # 라운드 데이터 변경 감지를 위한 롱폴링 경로
    path("rounds/<uuid:round_id>/poll/", RoundPollView.as_view(), name="round-poll"),

    # 특정 문항에 투표
    path("questions/<int:question_id>/vote/", VoteCreateView.as_view(), name="vote-create"),

    # 특정 파티의 활성 라운드 확인
    path("parties/<int:party_id>/active-round/", ActiveRoundCheckView.as_view(), name="active-round-check"),
]
