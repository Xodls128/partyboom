from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count, F
from detailview.models import Party, Participation
from detailview.serializers import PartyListSerializer, PartyDetailSerializer
from django.db import transaction
from detailview.models import Party, Place, Tag
from utils.partyAI import generate_party_by_ai
from django.utils import timezone
from rest_framework import generics


class PartyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["start_time", "created_at"]  # ?ordering=-start_time 같은 정렬 허용
    ordering = ["start_time"]                       # 기본 다가오는 순
    permission_classes = [AllowAny]

    def get_queryset(self): # 파티 목록 조회 가능
        qs =(
            Party.objects
            .select_related("place")
            .prefetch_related("tags", "participations__user")
            .annotate(applied_count=Count("participations",distinct=True))
            .filter(start_time__gte=timezone.now())   # ✅ 지난 파티 제외
        )

        # 필터링 옵션
        params = self.request.query_params
        place_id = params.get("place_id")
        if place_id:
            qs = qs.filter(place_id=place_id)

        date_from = params.get("date_from")  # ISO 문자열: 2025-08-25
        if date_from:
            qs = qs.filter(start_time__gte=date_from)

        date_to = params.get("date_to")
        if date_to:
            qs = qs.filter(start_time__lte=date_to)

        tag = params.get("tag")
        if tag:
            qs = qs.filter(tags__name=tag)

        return qs
    
    def get_serializer_class(self): # 파티 상세 정보 조회 가능
        if self.action == "retrieve":
            return PartyDetailSerializer
        return PartyListSerializer


# class PartyJoinAPIView(APIView): # 파티 참가 신청

#     permission_classes = [IsAuthenticated]

#     def post(self, request, party_id):
#         try:
#             with transaction.atomic():
#                 party = Party.objects.select_for_update().get(pk=party_id)

#                 if Participation.objects.filter(party=party, user=request.user).exists():
#                     return Response({"detail": "이미 신청한 파티입니다."}, status=status.HTTP_400_BAD_REQUEST)

#                 # 정원 검사 시, 확정된 인원만 카운트
#                 confirmed_count = Participation.objects.filter(party=party, status=Participation.Status.CONFIRMED).count()
#                 if confirmed_count >= party.max_participants:
#                     return Response({"detail": "정원이 초과되었습니다."}, status=status.HTTP_400_BAD_REQUEST)

#                 # 예약금 여부에 따라 상태 분기
#                 if party.deposit > 0:
#                     participation_status = Participation.Status.PENDING_PAYMENT
#                     message = "예약 신청이 완료되었습니다. 예약금을 결제해주세요."
#                 else:
#                     participation_status = Participation.Status.CONFIRMED
#                     message = "예약이 확정되었습니다."

#                 participation = Participation.objects.create(
#                     party=party, 
#                     user=request.user,
#                     status=participation_status
#                 )

#                 return Response(
#                     {
#                         "detail": message,
#                         "participation_id": participation.id,
#                         "status": participation.status,
#                     },
#                     status=status.HTTP_201_CREATED
#                 )
#         except Party.DoesNotExist:
#             return Response({"detail": "파티가 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)
        
class PartyLeaveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, party_id):
        try:
            with transaction.atomic():
                participation = Participation.objects.select_related('party', 'user').get(
                    party_id=party_id, 
                    user=request.user
                )
                
                party = participation.party
                user = participation.user

                # 환불 로직: 확정 상태였고, 예약금이 있었던 경우
                if participation.status == Participation.Status.CONFIRMED and party.deposit > 0:
                    user.points = F("points") + party.deposit
                    user.save(update_fields=["points"])
                    
                    # 결제 기록이 있다면 환불 상태로 변경 (선택적)
                    if hasattr(participation, 'payment'):
                        payment = participation.payment
                        payment.status = 'REFUNDED'
                        payment.save(update_fields=['status'])

                # 참여 기록 삭제
                participation.delete()

                return Response({"detail": "신청이 취소되었습니다."}, status=status.HTTP_200_OK)

        except Participation.DoesNotExist:
            return Response({"detail": "신청 내역이 없습니다."}, status=status.HTTP_400_BAD_REQUEST)


class AIPartyCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]  # AI 인증이면 토큰 필요

    def post(self, request):
        place_id = request.data.get("place_id")
        if not place_id:
            return Response({"error": "place_id가 필요합니다."}, status=400)
        
        try:
            place = Place.objects.get(id=place_id)
        except Place.DoesNotExist:
            return Response({"error": "존재하지 않는 장소입니다."}, status=404)

        # GPT-4 호출
        ai_data = generate_party_by_ai(place.name)

        if not ai_data:
            return Response({"error": "AI 응답 실패"}, status=500)

        # 파티 생성
        party = Party.objects.create(
            place=place,
            title=ai_data["title"],
            description=ai_data["description"],
            start_time=ai_data["start_time"],
            max_participants=ai_data["max_participants"],
            is_approved=True
        )

        # 태그 처리
        tags = ai_data.get("tags", [])
        for tag_name in tags:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            party.tags.add(tag)

        return Response({"message": "AI 파티 생성 완료", "party_id": party.id})

