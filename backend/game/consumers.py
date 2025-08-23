from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db import transaction
from .models import BalanceQuestion, BalanceVote

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

    async def receive_json(self, content):
        """
        클라이언트 -> 서버 투표 처리
        { "type": "vote", "question_id": 1, "choice": "A" }
        """
        if content.get("type") == "vote":
            question_id = content.get("question_id")
            choice = content.get("choice")
            user = self.scope["user"]

            if not user.is_authenticated:
                await self.send_json({"type": "error", "message": "로그인이 필요합니다."})
                return

            try:
                q = await self._record_vote(user.id, question_id, choice)

                # 모든 참가자에게 브로드캐스트
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "vote_update",
                        "data": {
                            "question_id": q.id,
                            "round_id": str(q.round_id),
                            "vote_a_count": q.vote_a_count,
                            "vote_b_count": q.vote_b_count,
                        },
                    },
                )
            except Exception as e:
                await self.send_json({"type": "error", "message": str(e)})

    async def vote_update(self, event):
        """
        서버 -> 클라이언트 브로드캐스트
        """
        await self.send_json({
            "type": "vote_update",
            "data": event["data"]
        })

    @sync_to_async
    @transaction.atomic
    def _record_vote(self, user_id, question_id, choice):
        """
        실제 투표 처리 (DB 트랜잭션)
        - BalanceVote 생성
        - BalanceQuestion 카운트 증가
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        user = User.objects.get(id=user_id)
        q = BalanceQuestion.objects.select_for_update().get(id=question_id)

        # 중복 투표 방지
        if BalanceVote.objects.filter(user=user, question=q).exists():
            raise ValueError("이미 투표하였습니다.")

        # 투표 저장
        BalanceVote.objects.create(user=user, question=q, choice=choice)

        # 카운트 증가
        if choice == "A":
            q.vote_a_count += 1
        elif choice == "B":
            q.vote_b_count += 1
        else:
            raise ValueError("선택지는 A 또는 B여야 합니다.")

        q.save(update_fields=["vote_a_count", "vote_b_count"])
        return q
    