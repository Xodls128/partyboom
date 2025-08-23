from rest_framework import serializers
from .models import Notice

class NoticeSerializer(serializers.ModelSerializer):
    notice_type_display = serializers.CharField(source="get_notice_type_display", read_only=True)
    target_party_id = serializers.IntegerField(source="target_party.id", read_only=True)

    class Meta:
        model = Notice
        fields = ["id", "notice_type", "notice_type_display", "message", "is_read", "created_at", "target_party_id"]
        