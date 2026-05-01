import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """Mensagem in-app. Persiste mesmo se o push falhar."""

    class Type(models.TextChoices):
        VACCINE = "VACCINE", "Vacina"
        VET_RETURN = "VET_RETURN", "Retorno ao vet"
        PAYMENT_DUE = "PAYMENT_DUE", "Vencimento de pagamento"
        PAYMENT_OK = "PAYMENT_OK", "Pagamento confirmado"
        PIN_GENERATED = "PIN_GENERATED", "PIN criado"
        VET_ACCESS_CLAIMED = "VET_ACCESS_CLAIMED", "Vet acessou prontuário"
        SYSTEM = "SYSTEM", "Sistema"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=32, choices=Type.choices)
    title = models.CharField(max_length=140)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} · {self.type} · {self.title[:40]}"


class NotificationPreference(models.Model):
    """Toggles por tipo. Default: tudo on. Tutor escolhe o que receber."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notif_prefs",
        primary_key=True,
    )
    push_vaccine = models.BooleanField(default=True)
    push_vet_return = models.BooleanField(default=True)
    push_payment_due = models.BooleanField(default=True)
    push_payment_ok = models.BooleanField(default=True)
    push_pin_generated = models.BooleanField(default=True)
    push_vet_access_claimed = models.BooleanField(default=True)
    push_system = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def allows(self, notif_type: str) -> bool:
        """Retorna True se o user permitiu push para este tipo."""
        field = f"push_{notif_type.lower()}"
        return bool(getattr(self, field, True))


class DevicePushToken(models.Model):
    """Token de push registrado por um dispositivo no login.

    iOS/Android (Expo Push) → expo_push_token.
    Web (VAPID) → web_push_endpoint + p256dh + auth.
    """

    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"
        WEB = "web", "Web"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_tokens",
    )
    platform = models.CharField(max_length=10, choices=Platform.choices)

    expo_push_token = models.CharField(max_length=255, blank=True, default="")

    web_push_endpoint = models.URLField(max_length=500, blank=True, default="")
    web_push_p256dh = models.CharField(max_length=255, blank=True, default="")
    web_push_auth = models.CharField(max_length=255, blank=True, default="")

    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["expo_push_token"],
                condition=~models.Q(expo_push_token=""),
                name="uniq_expo_push_token",
            ),
            models.UniqueConstraint(
                fields=["web_push_endpoint"],
                condition=~models.Q(web_push_endpoint=""),
                name="uniq_web_push_endpoint",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} · {self.platform}"

    @property
    def is_expo(self) -> bool:
        return self.platform in (self.Platform.IOS, self.Platform.ANDROID)

    @property
    def is_web(self) -> bool:
        return self.platform == self.Platform.WEB
