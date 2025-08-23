from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "name", "intro", "profile_photo","points", "warnings")

    def get_profile_photo(self, obj):
        request = self.context.get("request")
        url = obj.get_photo_url()
        return request.build_absolute_uri(url) if (request and url) else url
