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


class HealthRecordAttachment(models.Model):
    """Arquivo anexado a um HealthRecord (foto de receita, PDF de exame, etc.).

    O conteúdo é salvo via storage abstrato (`health.services.storage`) — local
    no MVP, S3 com presigned URLs em produção (Spec 04).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(
        HealthRecord,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name=_("registro de saúde"),
    )
    storage_key = models.CharField(
        _("chave do storage"), max_length=512,
        help_text=_("Caminho/ID do arquivo no backend de storage."),
    )
    file_name = models.CharField(_("nome do arquivo"), max_length=255)
    description = models.CharField(_("descrição"), max_length=500, blank=True, default="")
    mime_type = models.CharField(_("tipo MIME"), max_length=120, blank=True, default="")
    file_size = models.PositiveIntegerField(_("tamanho (bytes)"), default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="uploaded_attachments",
        verbose_name=_("enviado por"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("anexo")
        verbose_name_plural = _("anexos")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.file_name} ({self.record.title})"
