from rest_framework import permissions
from detailview.models import Participation

class IsParticipantOrAdmin(permissions.BasePermission):
    """
    POST → 로그인 + 파티 참여자만 허용
    그 외 요청 → 관리자만 허용
    """
    def has_permission(self, request, view):
        if request.method == 'POST':
            if not (request.user and request.user.is_authenticated):
                return False
            party_id = request.data.get('party')
            if not party_id:
                return False
            return Participation.objects.filter(
                user=request.user,
                party_id=party_id
            ).exists()
        return request.user and request.user.is_staff


class IsOwner(permissions.BasePermission):
    """
    객체의 user 필드가 요청 유저와 같을 때만 허용
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user