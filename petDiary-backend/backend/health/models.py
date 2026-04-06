import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class HealthRecord(models.Model):
    class RecordType(models.TextChoices):
        VACCINE = "VACCINE", _("Vacina")
        EXAM = "EXAM", _("Exame")
        PRESCRIPTION = "PRESCRIPTION", _("Receita")
        SURGERY = "SURGERY", _("Cirurgia")
        NOTE = "NOTE", _("Anotação")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pet = models.ForeignKey(
        "pets.Pet",
        on_delete=models.CASCADE,
        related_name="health_records",
        verbose_name=_("pet"),
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="authored_records",
        verbose_name=_("autor"),
    )
    record_type = models.CharField(
        _("tipo de registro"),
        max_length=20,
        choices=RecordType.choices,
    )
    title = models.CharField(_("título"), max_length=255)
    description = models.TextField(_("descrição"), blank=True, default="")
    date_occurred = models.DateField(_("data de ocorrência"))
    raw_extracted_text = models.TextField(
        _("texto extraído (OCR)"),
        blank=True,
        default="",
        help_text=_("Texto bruto extraído de documentos enviados."),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("registro de saúde")
        verbose_name_plural = _("registros de saúde")
        ordering = ["-date_occurred"]

    def __str__(self):
        return f"{self.title} ({self.pet.name})"
