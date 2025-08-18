from rest_framework import generics, permissions
from rest_framework.response import Response
from .serializers import ReserveJoinSerializer, PaymentSerializer, ReservePaySerializer

class ReserveJoinView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReserveJoinSerializer

    def create(self, request, *args, **kwargs):
        party_id = kwargs.get("party_id")
        serializer = self.get_serializer(data={"party_id": party_id})
        serializer.is_valid(raise_exception=True)
        participation = serializer.save()
        return Response(ParticipationSerializer(participation).data)

class ReservePayView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReservePaySerializer

    def create(self, request, *args, **kwargs):
        participation_id = self.kwargs.get("participation_id")  # URL에서 받음
        serializer = self.get_serializer(data={"participation_id": participation_id, **request.data})
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response(PaymentSerializer(payment).data)
    
