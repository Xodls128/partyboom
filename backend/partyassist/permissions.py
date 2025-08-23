from rest_framework.permissions import BasePermission
from detailview.models import Participation

class IsPartyParticipant(BasePermission):
    """
    요청자가 해당 파티의 참여자인지 확인
    """

    def has_permission(self, request, view):
        party_id = view.kwargs.get('pk')  # URL에서 party_id(pk) 가져오기
        if not party_id or not request.user.is_authenticated:
            return False
        return Participation.objects.filter(party_id=party_id, user=request.user).exists()