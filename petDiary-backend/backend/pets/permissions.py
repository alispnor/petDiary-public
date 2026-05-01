from django.utils import timezone
from rest_framework import permissions

from access.models import VetAccessToken
from accounts.models import User


def vet_has_active_access(user, pet) -> bool:
    """True se o vet `user` possui VetAccessToken ativo e não-expirado para o `pet`."""
    return VetAccessToken.objects.filter(
        pet=pet,
        vet=user,
        is_active=True,
        is_used=True,
        deleted_at__isnull=True,
        expires_at__gt=timezone.now(),
    ).exists()


class IsPetMemberOrHasVetAccess(permissions.BasePermission):
    """Permissão central de leitura/escrita do prontuário do pet.

    - **TUTOR (OWNER ou CARETAKER):** acessa o pet se for membro
      via `pets.PetMember`. OWNER tem privilégios extras (gerar/revogar
      PIN, convidar/remover caretakers) — esses são checados nas views
      específicas, não aqui.
    - **VET:** acessa o pet se possuir um `VetAccessToken` válido (ativo,
      usado, não revogado, não expirado).

    A classe trabalha tanto em endpoints de Pet quanto em endpoints
    aninhados (HealthRecord) — `getattr(obj, "pet", obj)` extrai o pet.
    """

    def has_object_permission(self, request, view, obj):
        pet = getattr(obj, "pet", obj)
        user = request.user

        if user.role == User.Role.TUTOR:
            return pet.has_member(user)

        if user.role == User.Role.VET:
            return vet_has_active_access(user, pet)

        return False


# Backwards-compat alias (algum import antigo pode chegar) — REMOVER após Fase 5
IsTutorOrHasVetAccess = IsPetMemberOrHasVetAccess
