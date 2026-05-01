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


def vet_had_historical_access(user, pet) -> bool:
    """True se o vet `user` JÁ teve um token usado para o `pet` (mesmo se expirado/revogado).

    Usado para diferenciar 403 (perdeu acesso) de 404 (nunca teve) — defesa
    contra enumeração de pets que o vet nunca conheceu.
    """
    return VetAccessToken.objects.filter(
        pet=pet, vet=user, is_used=True,
    ).exists()


class IsPetMemberOrHasVetAccess(permissions.BasePermission):
    """Permissão central de leitura/escrita do prontuário do pet.

    - **TUTOR (OWNER ou CARETAKER):** acessa o pet se for membro
      via `pets.PetMember`. OWNER tem privilégios extras (gerar/revogar
      PIN, convidar/remover caretakers) — esses são checados nas views
      específicas, não aqui.
    - **VET:** acessa o pet se possuir um `VetAccessToken` válido (ativo,
      usado, não revogado, não expirado).

    Funciona em endpoints de Pet e em endpoints aninhados (HealthRecord etc):
    - `has_permission`: usado em list/create — extrai `pet_pk` da URL,
      garante que o user tem acesso ao pet pai. Sem isso, qualquer auth
      user listava records de qualquer pet via /pets/<id>/health-records/.
    - `has_object_permission`: usado em retrieve/update/destroy — checa
      acesso direto ao objeto (`getattr(obj, "pet", obj)`).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Endpoint aninhado (ex.: /pets/<pet_pk>/health-records/) — sempre
        # exige acesso ao pet pai antes de tocar na sub-coleção.
        pet_pk = view.kwargs.get("pet_pk")
        if pet_pk:
            from .models import Pet  # import local: evita ciclo
            try:
                pet = Pet.objects.get(pk=pet_pk)
            except Pet.DoesNotExist:
                return False
            return self._user_can_access_pet(request.user, pet)

        # Endpoint top-level (ex.: /pets/) — listing/criando, queryset/
        # serializer cuidam do filtro/atribuição.
        return True

    def has_object_permission(self, request, view, obj):
        pet = getattr(obj, "pet", obj)
        return self._user_can_access_pet(request.user, pet)

    @staticmethod
    def _user_can_access_pet(user, pet) -> bool:
        if user.role == User.Role.TUTOR:
            return pet.has_member(user)
        if user.role == User.Role.VET:
            return vet_has_active_access(user, pet)
        return False


# Backwards-compat alias (algum import antigo pode chegar) — REMOVER após Fase 5
IsTutorOrHasVetAccess = IsPetMemberOrHasVetAccess
