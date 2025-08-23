from django.urls import path
from .views import RoundAICreateView, RoundRetrieveView, VoteCreateView, ActiveRoundCheckView

app_name = "game"

urlpatterns = [
    path("rounds/ai-create/", RoundAICreateView.as_view(), name="round-ai-create"),  # AI 기반 밸런스게임 라운드 생성
    path("rounds/<uuid:round_id>/", RoundRetrieveView.as_view(), name="round-retrieve"),  # 라운드 조회
    path("questions/<int:question_id>/vote/", VoteCreateView.as_view(), name="vote-create"),  # 투표 생성
    path("parties/<int:party_id>/active-round/", ActiveRoundCheckView.as_view(), name="active-round-check"),  # 특정 파티의 활성 라운드 확인
]
