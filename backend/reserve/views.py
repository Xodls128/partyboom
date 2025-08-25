from rest_framework import generics, permissions
from detailview.models import Participation
from rest_framework.response import Response
from .serializers import ReserveJoinSerializer, ParticipationSerializer, ReservePaySerializer, PaymentSerializer, ParticipationDetailSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from detailview.models import Party, Participation
from .serializers import ReserveJoinSerializer

class ReserveJoinView(generics.CreateAPIView):
    serializer_class = ReserveJoinSerializer

    def create(self, request, *args, **kwargs):
        user = request.user
        party_id = kwargs.get("party_id")
        party = get_object_or_404(Party, id=party_id)

        # ✅ 같은 날 다른 파티 참여 여부 체크
        same_day_exists = Participation.objects.filter(
            user=user,
            party__start_time__date=party.start_time.date()
        ).exists()
        if same_day_exists:
            # 여기서 직접 Response 내려주면 프론트에서 daily_limit true 잡을 수 있음
            return Response({"daily_limit": True}, status=status.HTTP_400_BAD_REQUEST)

        # 나머지는 serializer로 위임
        serializer = self.get_serializer(data={})
        serializer.is_valid(raise_exception=True)
        participation = serializer.save(user=user, party=party)

        return Response({"id": participation.id}, status=status.HTTP_201_CREATED)

class ParticipationDetailView(generics.RetrieveAPIView):
    queryset = Participation.objects.select_related("user", "party")
    serializer_class = ParticipationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    

class ReservePayView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReservePaySerializer

    def create(self, request, *args, **kwargs):
        participation_id = self.kwargs.get("participation_id")  # URL에서 받음
        serializer = self.get_serializer(data={"participation_id": participation_id, **request.data})
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        user = payment.participation.user
        # 결제 후 남은 포인트를 반환
        return Response({
                **PaymentSerializer(payment).data,
                "remaining_points": user.points
            })
                
