from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notice
from .serializers import NoticeSerializer
# import time, json
# from django.http import StreamingHttpResponse
from django.utils import timezone
# from rest_framework.decorators import api_view, permission_classes, authentication_classes
# from django.db import close_old_connections
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

from rest_framework.decorators import action
from datetime import timedelta
from detailview.models import Participation


# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# @authentication_classes([SessionAuthentication, JWTAuthentication]) 
# def notice_stream(request):
#     def event_stream():
#         last_check = timezone.now()
#         while True:
#             close_old_connections()
#             new_notices = Notice.objects.filter(
#                 user=request.user,
#                 created_at__gt=last_check
#             ).order_by("created_at")

#             if new_notices.exists():
#                 for n in new_notices:
#                     payload = {
#                         "id": n.id,
#                         "message": n.message,
#                         "type": n.notice_type,
#                         "target_party_id": n.target_party_id,
#                         "created_at": n.created_at.isoformat(),
#                     }
#                     yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

#                 last_check = new_notices.last().created_at  # 마지막 알림 기준으로 갱신

#             time.sleep(3)  # 3초마다 체크

#     return StreamingHttpResponse(event_stream(), content_type="text/event-stream")


class NoticeViewSet(viewsets.ModelViewSet):
    serializer_class = NoticeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notice.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        participations = (
            Participation.objects
            .filter(user=request.user, status=Participation.Status.CONFIRMED)
            .select_related("party")
        )

        now = timezone.now()
        notices = []
        for p in participations:
            start = p.party.start_time
            delta = start - now

            if timedelta(hours=23) <= delta <= timedelta(hours=24):
                notices.append({
                    "party_id": p.party.id,
                    "title": p.party.title,
                    "message": f"‘{p.party.title}’ 파티가 하루 뒤 열려요.",
                    "when": "1day",
                    "start_time": start,
                })
            elif timedelta(hours=1) <= delta <= timedelta(hours=2):
                notices.append({
                    "party_id": p.party.id,
                    "title": p.party.title,
                    "message": f"‘{p.party.title}’ 파티가 2시간 뒤 시작해요.",
                    "when": "2hours",
                    "start_time": start,
                })

        return Response(notices)

    # 읽음 처리 (PATCH)
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_read = True
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    