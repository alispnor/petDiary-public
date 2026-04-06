import random
import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


def generate_access_code():
    return f"{random.randint(0, 999999):06d}"


class VetAccessToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pet = models.ForeignKey(
        "pets.Pet",
        on_delete=models.CASCADE,
        related_name="access_tokens",
        verbose_name=_("pet"),
    )
    vet = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vet_access_tokens",
        verbose_name=_("veterinário"),
    )
    access_code = models.CharField(
        _("código de acesso"),
        max_length=6,
        default=generate_access_code,
    )
    expires_at = models.DateTimeField(_("expira em"))
    is_active = models.BooleanField(_("ativo"), default=True)
    is_used = models.BooleanField(_("utilizado"), default=False)
    deleted_at = models.DateTimeField(_("excluído em"), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("token de acesso veterinário")
        verbose_name_plural = _("tokens de acesso veterinário")

    def __str__(self):
        return f"PIN {self.access_code} → {self.pet.name}"
