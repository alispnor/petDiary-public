from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.views import TokenObtainPairView

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


class PetDiaryTokenObtainPairView(TokenObtainPairView):
    """Custom token view com regra de sessão única para veterinários.

    Comportamento:
    - TUTOR: múltiplas sessões coexistem (família compartilha conta em vários
      dispositivos sem problema).
    - VET: ao logar, blacklista TODOS os refresh tokens anteriores não-blacklistados.
      Resultado: assim que o refresh expirar (ou for usado), o vet anterior cai.
      Para garantir derrubada imediata, manter ACCESS_TOKEN_LIFETIME curto
      (30 min é o default).

    A regra protege dados clínicos: em uma clínica com vários computadores,
    se alguém esquece a sessão aberta, o próximo login automaticamente derruba.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code != 200:
            return response

        username = (request.data.get("username") or "").strip().lower()
        if not username:
            return response

        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return response

        if user.role == User.Role.VET:
            # Blacklist todos os outstanding tokens deste vet ANTERIORES ao recém-emitido.
            # O novo refresh acabou de ser criado por super().post() e já consta no
            # OutstandingToken; o `exclude` por jti garante que não blacklistamos ele mesmo.
            new_refresh_jti = (response.data or {}).get("refresh")
            # SimpleJWT armazena jti dentro do token; pra cobrir tudo simplesmente
            # blacklistamos os tokens com `created_at` anterior ao do novo.
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
            from rest_framework_simplejwt.tokens import RefreshToken

            new_jti = None
            if new_refresh_jti:
                try:
                    new_jti = RefreshToken(new_refresh_jti).get("jti")
                except Exception:
                    new_jti = None

            outstanding = OutstandingToken.objects.filter(user=user)
            if new_jti:
                outstanding = outstanding.exclude(jti=new_jti)

            for token in outstanding:
                BlacklistedToken.objects.get_or_create(token=token)

        return response
