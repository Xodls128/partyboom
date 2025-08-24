from rest_framework import generics, permissions
from detailview.models import Participation
from rest_framework.response import Response
from .serializers import ReserveJoinSerializer, ParticipationSerializer, ReservePaySerializer, PaymentSerializer, ParticipationDetailSerializer

class ReserveJoinView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReserveJoinSerializer

    def create(self, request, *args, **kwargs):
        party_id = kwargs.get("party_id")
        serializer = self.get_serializer(data={"party_id": party_id})
        serializer.is_valid(raise_exception=True)
        participation = serializer.save()
        return Response(ParticipationSerializer(participation).data)

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
                
