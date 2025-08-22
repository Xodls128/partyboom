from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer

class UserDetailView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)
    