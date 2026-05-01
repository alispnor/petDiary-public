"""Permissions de billing.

IsActivePro: true se o user OU algum OWNER de pet onde o user é membro
tem subscription PRO ativa. (Decisão durável Ali 2026-05-01: caretakers
herdam o PRO do owner sem pagar separado.)
"""
from rest_framework import permissions

from .models import Subscription


def has_pro_access(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    sub = getattr(user, "subscription", None)
    if sub and sub.is_pro_active:
        return True

    # Caretakers herdam: checa se algum pet onde é membro tem owner PRO
    from pets.models import PetMember
    member_pets = PetMember.objects.filter(user=user).values_list("pet_id", flat=True)
    if not member_pets:
        return False
    has_pro_owner = (
        Subscription.objects
        .filter(
            user__pet_memberships__pet_id__in=list(member_pets),
            user__pet_memberships__role=PetMember.Role.OWNER,
            plan_type=Subscription.Plan.PRO,
            status=Subscription.Status.ACTIVE,
        )
        .exists()
    )
    return has_pro_owner


class IsActivePro(permissions.BasePermission):
    message = "Recurso disponível apenas no plano PRO."

    def has_permission(self, request, view):
        return has_pro_access(request.user)
