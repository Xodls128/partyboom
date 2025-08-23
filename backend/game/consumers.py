from channels.generic.websocket import AsyncJsonWebsocketConsumer

class BalanceRoundConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.round_id = self.scope["url_route"]["kwargs"].get("round_id")
        if not self.round_id:
            await self.close()
            return
        self.group_name = f"round_{self.round_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # 클라이언트 -> 서버 메시지 (지금은 REST에서 처리)
    async def receive_json(self, content):
        # 필요하다면 여기서도 투표 처리 가능
        pass

    # 서버 -> 클라이언트 브로드캐스트
    async def vote_update(self, event):
        await self.send_json({
            "type": "vote_update",
            **event["data"]  # question_id, round_id, vote_a_count, vote_b_count
        })
        