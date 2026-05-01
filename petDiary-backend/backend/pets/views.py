from django.utils import timezone
from rest_framework import viewsets

from access.models import VetAccessToken
from accounts.models import User

from .models import Pet
from .permissions import IsPetMemberOrHasVetAccess
from .serializers import PetSerializer


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsPetMemberOrHasVetAccess]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.TUTOR:
            # OWNER ou CARETAKER (qualquer membro) acessa o pet
            return Pet.objects.filter(members__user=user).distinct()
        if user.role == User.Role.VET:
            pet_ids = VetAccessToken.objects.filter(
                vet=user,
                is_active=True,
                is_used=True,
                deleted_at__isnull=True,
                expires_at__gt=timezone.now(),
            ).values_list("pet_id", flat=True)
            return Pet.objects.filter(id__in=pet_ids)
        return Pet.objects.none()
