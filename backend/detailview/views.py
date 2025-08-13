from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count
from .models import Party, Participation
from .serializers import PartyListSerializer, PartyDetailSerializer
from django.db import transaction

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
            .prefetch_related("tags")
            .annotate(applied_count=Count("participations",distinct=True))
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


class PartyJoinAPIView(APIView): # 파티 참가 신청

    permission_classes = [IsAuthenticated]

    def post(self, request, party_id):
        try:
            # 1) 트랜잭션 + 행 잠금으로 레이스 방지
            with transaction.atomic():
                party = (
                    Party.objects
                    .select_for_update()           # 이 파티 row 잠금
                    .select_related("place")
                    .get(pk=party_id)
                )

                # 2) 중복 신청 방지
                if Participation.objects.filter(party=party, user=request.user).exists():
                    return Response({"detail": "이미 신청한 파티입니다."}, status=status.HTTP_400_BAD_REQUEST)

                # 3) 정원 검사(잠금 하에서 정확)
                current = Participation.objects.filter(party=party).count()
                if current >= party.max_participants:
                    return Response({"detail": "정원이 초과되었습니다."}, status=status.HTTP_400_BAD_REQUEST)

                # 4) 참가 생성
                Participation.objects.create(party=party, user=request.user)

                # 5) 최신 인원 수 반환(프론트 즉시 반영 용도)
                new_count = current + 1
                return Response(
                    {
                        "detail": "파티 신청 완료!",
                        "applied_count": new_count,
                        "max_participants": party.max_participants,
                    },
                    status=status.HTTP_201_CREATED
                )
        except Party.DoesNotExist:
            return Response({"detail": "파티가 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)
        