"""Modelo de Assinatura (Spec 01 — implementação stub).

A integração real com gateway (Asaas/Mercado Pago) virá em fase futura.
Por ora, todo usuário tem uma Subscription FREE criada no signal post_save.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Subscription(models.Model):
    class Plan(models.TextChoices):
        FREE = "FREE", _("Grátis")
        PRO = "PRO", _("PRO")

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", _("Ativa")
        TRIALING = "TRIALING", _("Em período de teste")
        PAST_DUE = "PAST_DUE", _("Pagamento atrasado")
        CANCELED = "CANCELED", _("Cancelada")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
        verbose_name=_("usuário"),
    )
    plan_type = models.CharField(
        _("plano"),
        max_length=10,
        choices=Plan.choices,
        default=Plan.FREE,
    )
    status = models.CharField(
        _("status"),
        max_length=12,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    gateway_subscription_id = models.CharField(
        _("ID externo no gateway"),
        max_length=120,
        blank=True,
        default="",
    )
    current_period_end = models.DateTimeField(
        _("renovação em"),
        null=True,
        blank=True,
    )
    cancel_at_period_end = models.BooleanField(
        _("cancelar ao final do período"),
        default=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("assinatura")
        verbose_name_plural = _("assinaturas")

    def __str__(self):
        return f"{self.user} — {self.plan_type} ({self.status})"

    @property
    def is_pro_active(self) -> bool:
        return self.plan_type == self.Plan.PRO and self.status in (
            self.Status.ACTIVE, self.Status.TRIALING,
        )
