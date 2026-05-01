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

    # === Contato (email, phone obrigatórios; whatsapp = flag de uso) ===
    phone = models.CharField(
        _("telefone/celular"),
        max_length=20,
        blank=True,
        default="",
        help_text=_("Número com DDD. Ex.: (11) 99999-9999"),
    )
    whatsapp = models.BooleanField(
        _("aceita WhatsApp"),
        default=False,
        help_text=_("Este número pode receber mensagens via WhatsApp."),
    )

    # === Documento (opcional) ===
    document = models.CharField(
        _("CPF"),
        max_length=14,
        blank=True,
        default="",
        help_text=_("CPF do tutor (opcional). Pode estar mascarado."),
    )

    # === Veterinário ===
    crmv = models.CharField(
        _("CRMV"),
        max_length=20,
        blank=True,
        default="",
        help_text=_("Registro no conselho (apenas veterinários)."),
    )
    clinic_name = models.CharField(
        _("nome da clínica/consultório"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Apenas para veterinários."),
    )

    # === Endereço estruturado ===
    address_zip = models.CharField(_("CEP"), max_length=10, blank=True, default="")
    address_street = models.CharField(_("rua/logradouro"), max_length=255, blank=True, default="")
    address_number = models.CharField(_("número"), max_length=20, blank=True, default="")
    address_complement = models.CharField(_("complemento"), max_length=120, blank=True, default="")
    address_district = models.CharField(_("bairro"), max_length=120, blank=True, default="")
    address_city = models.CharField(_("cidade"), max_length=120, blank=True, default="")
    address_state = models.CharField(_("estado/UF"), max_length=2, blank=True, default="")

    class Meta:
        verbose_name = _("usuário")
        verbose_name_plural = _("usuários")

    def __str__(self):
        return self.full_name or self.username
