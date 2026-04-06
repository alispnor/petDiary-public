from django.utils import timezone
from rest_framework import permissions

from access.models import VetAccessToken
from accounts.models import User


class IsTutorOrHasVetAccess(permissions.BasePermission):
    """
    - TUTOR: pode acessar apenas seus próprios pets.
    - VET: pode acessar um pet se possuir um VetAccessToken válido e ativo.
    """

    def has_object_permission(self, request, view, obj):
        pet = getattr(obj, "pet", obj)

        if request.user.role == User.Role.TUTOR:
            return pet.tutor_id == request.user.id

        if request.user.role == User.Role.VET:
            return VetAccessToken.objects.filter(
                pet=pet,
                vet=request.user,
                is_active=True,
                is_used=True,
                deleted_at__isnull=True,
                expires_at__gt=timezone.now(),
            ).exists()

        return False
