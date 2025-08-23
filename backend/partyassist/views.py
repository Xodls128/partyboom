from django.shortcuts import render
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsPartyParticipant
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .serializers import MyPartySerializer, PartyParticipantSerializer
from django.utils.timezone import now
from detailview.models import Party, Participation

class MyPartyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MyPartySerializer

    def get_queryset(self):
        # 내가 신청했고, 아직 시작하지 않았고, 취소되지 않은 파티만
        return Party.objects.filter(
            participations__user=self.request.user,
            start_time__gt=now(),
            is_cancelled=False   # Party 모델에 취소가 False인 경우만
        )
    
    

class StandbyViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated & IsPartyParticipant]

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        participation = Participation.objects.get(party_id=pk, user=request.user)

        # toggle
        participation.is_standby = not participation.is_standby
        participation.save()

        # 카운트 계산
        participation_count = Participation.objects.filter(party_id=pk).count()
        standby_count = Participation.objects.filter(party_id=pk, is_standby=True).count()

        # WebSocket 브로드캐스트
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"party_{pk}",
            {
                "type": "send_standby_update",
                "data": {
                    "party_id": pk,
                    "participation_count": participation_count,
                    "standby_count": standby_count
                }
            }
        )

        return Response({
            "party_id": pk,
            "user_id": request.user.id,
            "is_standby": participation.is_standby,
            "participation_count": participation_count,
            "standby_count": standby_count
        }, status=status.HTTP_200_OK)
        
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        try:
            party = Party.objects.get(pk=pk)
        except Party.DoesNotExist:
            return Response({"detail": "존재하지 않는 파티입니다."}, status=404)

        # 파티 시작 전이면 접근 차단
        if party.start_time > now():
            return Response(
                {"detail": "파티 시작 이후에만 참여자 목록을 볼 수 있습니다."},
                status=403
            )

        participants = Participation.objects.filter(party=party).select_related("user")
        serializer = PartyParticipantSerializer(
            participants,
            many=True,
            context={"request": request}   # ✅ request를 context로 넘겨야 함
        )
        return Response(serializer.data, status=200)
    