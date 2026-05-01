from datetime import timedelta

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import VetAccessToken
from .serializers import ClaimAccessSerializer, VetAccessTokenSerializer


DEFAULT_PIN_LIFETIME = timedelta(hours=1)


class GeneratePinView(generics.CreateAPIView):
    """Tutor gera um PIN de acesso para um pet."""

    serializer_class = VetAccessTokenSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != User.Role.TUTOR:
            return Response(
                {"detail": _("Apenas tutores podem gerar PINs.")},
                status=status.HTTP_403_FORBIDDEN,
            )

        pet_id = request.data.get("pet")
        if not request.user.pets.filter(id=pet_id).exists():
            return Response(
                {"detail": _("Este pet não pertence a você.")},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Default expires_at = agora + 1h se cliente não enviar
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if not data.get("expires_at"):
            data["expires_at"] = (timezone.now() + DEFAULT_PIN_LIFETIME).isoformat()

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ClaimAccessView(APIView):
    """Vet valida um PIN e obtém acesso ao pet."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.VET:
            return Response(
                {"detail": _("Apenas veterinários podem validar PINs.")},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClaimAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["access_code"]
        now = timezone.now()

        token = VetAccessToken.objects.filter(
            access_code=code,
            is_active=True,
            is_used=False,
            deleted_at__isnull=True,
            expires_at__gt=now,
        ).first()

        if not token:
            return Response(
                {"detail": _("PIN inválido ou expirado.")},
                status=status.HTTP_404_NOT_FOUND,
            )

        token.vet = request.user
        token.is_used = True
        token.save(update_fields=["vet", "is_used"])

        return Response(
            VetAccessTokenSerializer(token).data,
            status=status.HTTP_200_OK,
        )
