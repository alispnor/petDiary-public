from django.http import Http404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from access.models import VetAccessToken
from accounts.models import User

from .models import Pet
from .permissions import (
    IsPetMemberOrHasVetAccess,
    vet_had_historical_access,
    vet_has_active_access,
)
from .serializers import PetSerializer


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsPetMemberOrHasVetAccess]

    def get_queryset(self):
        """Listagem — só pets aos quais o user tem acesso ATUAL.

        `retrieve`/`update`/`destroy` usam `get_object` abaixo, que
        diferencia 403 (perdeu acesso) de 404 (nunca teve), pra não
        vazar existência de pets desconhecidos mas dar feedback claro
        ao vet que tinha sessão e foi revogado.
        """
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

    def get_object(self):
        """Resolve um pet específico com semântica explícita 403 vs 404.

        Política:
        - TUTOR não-membro → 404 (não vaza existência)
        - VET com acesso ativo → retorna o pet
        - VET que TEVE acesso mas perdeu (token usado mas revogado/expirado)
          → 403 com mensagem específica (frontend dispara modal de revogação)
        - VET que NUNCA teve acesso → 404 (não vaza existência)
        - Pet não existe → 404
        """
        user = self.request.user
        pk = self.kwargs.get(self.lookup_field or "pk")

        try:
            pet = Pet.objects.get(pk=pk)
        except Pet.DoesNotExist:
            raise Http404

        if user.role == User.Role.TUTOR:
            if not pet.has_member(user):
                raise Http404
            return pet

        if user.role == User.Role.VET:
            if vet_has_active_access(user, pet):
                return pet
            if vet_had_historical_access(user, pet):
                raise PermissionDenied(
                    _("Seu acesso a este pet expirou ou foi revogado pelo tutor."),
                )
            raise Http404

        raise Http404
