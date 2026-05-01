from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import UserCreateSerializer, UserSerializer


class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]


class UserMeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class CheckUsernameView(APIView):
    """Endpoint público para verificar disponibilidade de username em tempo real."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = (request.query_params.get("username") or "").strip().lower()

        if not username or len(username) < 3:
            return Response(
                {"available": False, "reason": "too_short"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exists = User.objects.filter(username__iexact=username).exists()
        return Response({"available": not exists, "username": username})
