from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination

from pets.models import Pet

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PetAuditListView(generics.ListAPIView):
    """Lista entradas de auditoria de um pet específico.

    Apenas membros do pet (OWNER ou CARETAKER) podem visualizar.
    Vets com acesso ativo TAMBÉM podem ler (transparência clínica).
    """

    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditPagination

    def get_queryset(self):
        pet = get_object_or_404(Pet, pk=self.kwargs["pet_pk"])
        user = self.request.user

        # OWNER/CARETAKER OK
        if pet.has_member(user):
            return pet.audit_logs.select_related("actor").order_by("-created_at")

        # Vet com acesso ativo OK
        from access.models import VetAccessToken
        from django.utils import timezone
        from accounts.models import User
        if user.role == User.Role.VET:
            has_access = VetAccessToken.objects.filter(
                pet=pet, vet=user, is_active=True, is_used=True,
                deleted_at__isnull=True, expires_at__gt=timezone.now(),
            ).exists()
            if has_access:
                return pet.audit_logs.select_related("actor").order_by("-created_at")

        return AuditLog.objects.none()
