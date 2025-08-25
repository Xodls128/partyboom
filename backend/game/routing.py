from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/game/round/(?P<round_id>[0-9a-f-]+)/$", consumers.BalanceRoundConsumer.as_asgi()),
    re_path(r"ws/party/(?P<round_id>\d+)/$", consumers.BalanceRoundConsumer.as_asgi()),
]