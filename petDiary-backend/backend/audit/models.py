"""Auditoria de mutações: registra quem fez o quê e quando.

Princípios:
- Apenas mutações (CREATE/UPDATE/DELETE), nunca leituras (decisão durável do Ali).
- Preserva nome do ator mesmo se a conta for excluída (actor_name_snapshot).
- Indexado por pet, ator e entity para queries eficientes.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "CREATE", _("Criou")
        UPDATE = "UPDATE", _("Atualizou")
        DELETE = "DELETE", _("Excluiu")
        REVOKE = "REVOKE", _("Revogou")
        CLAIM = "CLAIM", _("Acessou via PIN")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_actions",
        verbose_name=_("ator"),
    )
    actor_name_snapshot = models.CharField(
        _("nome do ator (snapshot)"), max_length=255,
        help_text=_("Preservado mesmo se a conta for excluída."),
    )
    actor_role_snapshot = models.CharField(_("papel do ator"), max_length=20, blank=True, default="")
    action = models.CharField(_("ação"), max_length=20, choices=Action.choices)
    entity_type = models.CharField(_("tipo de entidade"), max_length=50)  # "HealthRecord", "Pet", etc.
    entity_id = models.UUIDField(_("id da entidade"), null=True, blank=True)
    pet = models.ForeignKey(
        "pets.Pet",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_logs",
        help_text=_("Pet relacionado (facilita filtros por prontuário)."),
    )
    description = models.CharField(_("descrição"), max_length=500, blank=True, default="")
    changes = models.JSONField(_("alterações"), default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(_("data/hora"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("registro de auditoria")
        verbose_name_plural = _("registros de auditoria")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["pet", "-created_at"]),
            models.Index(fields=["actor", "-created_at"]),
            models.Index(fields=["entity_type", "entity_id"]),
        ]

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {self.actor_name_snapshot} {self.action} {self.entity_type}"
