from channels.generic.websocket import AsyncJsonWebsocketConsumer
import json

class BalanceRoundConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        """
        클라이언트가 특정 라운드에 접속하면 round_id 기반 그룹에 가입
        """
        self.round_id = self.scope["url_route"]["kwargs"].get("round_id")
        
        # 디버그 로그 추가
        print(f"WebSocket connect attempt: round_id = {self.round_id}")
        
        if not self.round_id:
            print("No round_id found, closing connection.")
            await self.close()
            return

        self.group_name = f"round_{self.round_id}"
        
        # 그룹에 추가하고 연결 수락
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        # WebSocket 연결을 승인하고 클라이언트에 응답
        await self.accept()
        print(f"WebSocket connection accepted for group: {self.group_name}")

    async def disconnect(self, code):
        """
        클라이언트 연결 종료 시 그룹에서 제거
        """
        print(f"WebSocket disconnected with code {code}, removing from group {self.group_name}")
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def vote_update(self, event):
        """
        서버 → 클라이언트 브로드캐스트
        (HTTP API에서 투표 처리 후 channel_layer.group_send로 호출됨)
        """
        print(f"Sending vote update to group {self.group_name}: {event['data']}")
        
        await self.send_json({
            "type": "vote_update",
            "data": event["data"]
        })
