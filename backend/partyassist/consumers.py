import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PartyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.party_id = self.scope["url_route"]["kwargs"]["party_id"]
        self.room_group_name = f"party_{self.party_id}"

        # 그룹에 가입
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # 그룹 탈퇴
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # 클라이언트에서 메시지 받았을 때 (지금은 서버 push만 할 거라 pass)
    async def receive(self, text_data):
        pass

    # 서버에서 브로드캐스트 호출 시 실행
    async def send_standby_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))
