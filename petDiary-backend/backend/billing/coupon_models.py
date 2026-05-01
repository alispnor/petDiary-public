"""Modelo Coupon (Spec 12)."""
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Coupon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(_("código"), max_length=32, unique=True, db_index=True)
    discount_percent = models.PositiveSmallIntegerField(
        _("desconto (%)"),
        validators=[MinValueValidator(1), MaxValueValidator(100)],
    )
    valid_until = models.DateTimeField(_("válido até"))
    max_uses = models.PositiveIntegerField(_("usos máximos"), default=1)
    current_uses = models.PositiveIntegerField(_("usos atuais"), default=0)
    is_active = models.BooleanField(_("ativo"), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="created_coupons",
    )

    class Meta:
        verbose_name = _("cupom")
        verbose_name_plural = _("cupons")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} ({self.discount_percent}% off)"

    @property
    def is_valid(self) -> bool:
        return (
            self.is_active
            and self.valid_until > timezone.now()
            and self.current_uses < self.max_uses
        )
