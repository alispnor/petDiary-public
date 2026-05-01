from datetime import timedelta

from django.db.models import Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from pets.models import Pet

from .models import VetAccessToken
from .serializers import (
    ActiveAccessSerializer,
    ClaimAccessSerializer,
    HistoryAccessSerializer,
    VetAccessTokenSerializer,
)


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
        token.claimed_at = now
        token.save(update_fields=["vet", "is_used", "claimed_at"])

        return Response(
            VetAccessTokenSerializer(token).data,
            status=status.HTTP_200_OK,
        )


class RevokeAccessView(APIView):
    """Tutor revoga acesso de um vet a um pet (soft-delete do token)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token_id):
        if request.user.role != User.Role.TUTOR:
            return Response(
                {"detail": _("Apenas tutores podem revogar acessos.")},
                status=status.HTTP_403_FORBIDDEN,
            )

        token = get_object_or_404(
            VetAccessToken,
            id=token_id,
            pet__tutor=request.user,  # garante que o tutor é dono do pet
            deleted_at__isnull=True,
        )

        now = timezone.now()
        token.is_active = False
        token.deleted_at = now
        token.save(update_fields=["is_active", "deleted_at"])

        return Response(
            {"detail": _("Acesso revogado com sucesso."), "id": str(token.id)},
            status=status.HTTP_200_OK,
        )


class ActiveAccessListView(generics.ListAPIView):
    """Tutor lista vets que têm acesso ativo aos seus pets.

    Inclui apenas tokens onde:
    - is_active=True
    - is_used=True (vet já fez claim)
    - deleted_at IS NULL (não revogado)
    - expires_at > now (não expirado)
    """

    serializer_class = ActiveAccessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.TUTOR:
            return VetAccessToken.objects.none()

        return (
            VetAccessToken.objects.filter(
                pet__tutor=self.request.user,
                is_active=True,
                is_used=True,
                deleted_at__isnull=True,
                expires_at__gt=timezone.now(),
            )
            .select_related("pet", "vet")
            .order_by("-claimed_at")
        )


class AccessHistoryListView(generics.ListAPIView):
    """Vet lista pets que visitou (com PIN usado), com status atual.

    Status possíveis (computed):
    - ACTIVE   — token válido (não expirado, não revogado)
    - EXPIRED  — token venceu (expires_at < now)
    - REVOKED  — tutor revogou (deleted_at != null)
    """

    serializer_class = HistoryAccessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.VET:
            return VetAccessToken.objects.none()

        return (
            VetAccessToken.objects.filter(
                vet=self.request.user,
                is_used=True,
            )
            .select_related("pet", "pet__tutor")
            .order_by("-claimed_at")
        )