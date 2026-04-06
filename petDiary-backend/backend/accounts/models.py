import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Role(models.TextChoices):
        TUTOR = "TUTOR", _("Tutor")
        VET = "VET", _("Veterinário")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    iam_uid = models.CharField(
        _("IAM UID"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Identificador externo do provedor de identidade."),
    )
    role = models.CharField(
        _("papel"),
        max_length=10,
        choices=Role.choices,
        default=Role.TUTOR,
    )
    full_name = models.CharField(_("nome completo"), max_length=255)
    crmv = models.CharField(
        _("CRMV"),
        max_length=20,
        blank=True,
        default="",
        help_text=_("Registro no conselho (apenas veterinários)."),
    )

    class Meta:
        verbose_name = _("usuário")
        verbose_name_plural = _("usuários")

    def __str__(self):
        return self.full_name or self.username
