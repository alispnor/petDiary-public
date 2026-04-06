from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import VetAccessToken
from .serializers import ClaimAccessSerializer, VetAccessTokenSerializer


class GeneratePinView(generics.CreateAPIView):
    """Tutor gera um PIN de acesso para um pet."""

    serializer_class = VetAccessTokenSerializer

    def perform_create(self, serializer):
        serializer.save()

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

        return super().create(request, *args, **kwargs)


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
