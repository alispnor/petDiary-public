"""Endpoints para Reminders (lembretes de vacina, retorno ao vet etc.)"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from pets.models import Pet
from pets.permissions import IsPetMemberOrHasVetAccess

from .models import Reminder
from .serializers import ReminderSerializer


def _user_can_access_pet(user, pet) -> bool:
    """Reaproveita lógica de membro OU vet com acesso ativo."""
    from access.models import VetAccessToken

    if pet.has_member(user):
        return True
    return VetAccessToken.objects.filter(
        pet=pet, vet=user, is_active=True, deleted_at__isnull=True
    ).exists()


class ReminderListCreateView(generics.ListCreateAPIView):
    """GET lista, POST cria. URL aninhada em /pets/<pet_pk>/reminders/."""

    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        pet = get_object_or_404(Pet, pk=self.kwargs["pet_pk"])
        if not _user_can_access_pet(self.request.user, pet):
            return Reminder.objects.none()
        return Reminder.objects.filter(pet=pet).order_by(
            "dismissed_at", "date_due"
        )

    def perform_create(self, serializer):
        pet = get_object_or_404(Pet, pk=self.kwargs["pet_pk"])
        # Apenas membros OWNER/CARETAKER podem criar (vet com acesso lê
        # mas não cria — evita poluir agenda do tutor)
        if not pet.has_member(self.request.user):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Apenas tutor/familiar do pet pode criar lembretes.")
        serializer.save(pet=pet, created_by=self.request.user)


class ReminderDetailView(generics.RetrieveDestroyAPIView):
    """DELETE em /reminders/<id>/."""

    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "pk"

    def get_queryset(self):
        return Reminder.objects.filter(pet__members__user=self.request.user)


class ReminderDismissView(APIView):
    """POST /reminders/<id>/dismiss/ — marca como resolvido."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reminder = get_object_or_404(
            Reminder, pk=pk, pet__members__user=request.user
        )
        if reminder.dismissed_at is None:
            reminder.dismissed_at = timezone.now()
            reminder.save(update_fields=["dismissed_at"])
        return Response(ReminderSerializer(reminder).data, status=status.HTTP_200_OK)
