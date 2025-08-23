# from rest_framework.generics import ListAPIView
# from rest_framework.permissions import AllowAny
# from detailview.models import Party
# from detailview.serializers import PartySerializer

# class HomePartyListView(ListAPIView):
#     """
#     홈 화면에 보여줄 파티 목록을 반환하는 API
#     """
#     queryset = Party.objects.filter(is_approved=True, is_cancelled=False).order_by("-created_at")
#     serializer_class = PartySerializer
#     permission_classes = [AllowAny] # 인증 없이도 조회 가능
