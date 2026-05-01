"""Modelos de Coupon (Spec 12) + CouponRedemption (relatório de uso)."""
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
    max_uses = models.PositiveIntegerField(
        _("usos totais máximos"), default=1,
        help_text=_("Quantidade total de usos do cupom (todos os usuários somados)."),
    )
    max_per_user = models.PositiveIntegerField(
        _("usos máximos por usuário"), default=1,
        help_text=_("Cada usuário pode usar este cupom no máximo X vezes."),
    )
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

    def can_be_used_by(self, user) -> bool:
        """Checa se o user específico ainda pode resgatar este cupom."""
        if not self.is_valid:
            return False
        if not user or not user.is_authenticated:
            return False
        used_by_user = CouponRedemption.objects.filter(
            coupon=self, user=user,
        ).count()
        return used_by_user < self.max_per_user


class CouponRedemption(models.Model):
    """Registro de cada uso (resgate) de cupom — relatório de uso."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coupon = models.ForeignKey(
        Coupon, on_delete=models.CASCADE, related_name="redemptions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="coupon_redemptions",
    )
    user_name_snapshot = models.CharField(max_length=255, blank=True, default="")
    user_email_snapshot = models.CharField(max_length=255, blank=True, default="")
    discount_percent = models.PositiveSmallIntegerField()
    final_price_brl = models.DecimalField(max_digits=10, decimal_places=2)
    redeemed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("uso de cupom")
        verbose_name_plural = _("usos de cupons")
        ordering = ["-redeemed_at"]
        indexes = [
            models.Index(fields=["coupon", "-redeemed_at"]),
            models.Index(fields=["user", "-redeemed_at"]),
        ]

    def __str__(self):
        return f"{self.coupon.code} — {self.user_name_snapshot} em {self.redeemed_at:%d/%m/%Y}"
