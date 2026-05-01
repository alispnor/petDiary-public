import secrets
import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


def _random_six_digit_code() -> str:
    """Gera 6 dígitos com `secrets` (cryptographically random, não previsível).

    Usar `secrets` em vez de `random.randint` é boa prática pra qualquer código
    que sirva de credencial — `random.Random` é determinístico (seedável) e
    teoricamente previsível dado um histórico suficiente de saídas.
    """
    return f"{secrets.randbelow(1_000_000):06d}"


def generate_unique_access_code(model_cls=None, max_attempts: int = 10) -> str:
    """Gera um código único entre os PINs ATIVOS e não-resgatados.

    Estratégia em duas camadas:
    1. Aplicação (este loop): em até `max_attempts` tenta gerar um código que
       não colida com nenhum token ativo (não usado, não revogado).
    2. Banco (UniqueConstraint): índice parcial garante que mesmo sob
       concorrência, dois INSERTs com o mesmo código falham — view deve
       capturar IntegrityError e tentar de novo.

    Default `model_cls=None` aceita evitar import circular durante migrations.
    """
    if model_cls is None:
        model_cls = VetAccessToken
    for _attempt in range(max_attempts):
        code = _random_six_digit_code()
        exists = model_cls.objects.filter(
            access_code=code,
            is_active=True,
            is_used=False,
            deleted_at__isnull=True,
        ).exists()
        if not exists:
            return code
    # Espaço de chaves de 1M é grande o suficiente — esgotar 10 tentativas
    # significa que algo está muito errado (ex.: alguém criando milhares de
    # PINs simultâneos). Falhamos alto pra a view tratar.
    raise RuntimeError(
        "Não foi possível gerar um código de acesso único após "
        f"{max_attempts} tentativas."
    )


def generate_access_code() -> str:
    """Default callable do field — só pra novos rows. A unicidade real
    fica garantida pelo helper acima (chamado pela view) + constraint."""
    return _random_six_digit_code()


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
    claimed_at = models.DateTimeField(
        _("usado em"), null=True, blank=True,
        help_text=_("Quando o veterinário fez o claim do PIN."),
    )
    deleted_at = models.DateTimeField(_("excluído em"), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("token de acesso veterinário")
        verbose_name_plural = _("tokens de acesso veterinário")
        constraints = [
            # Garante no DB: um código só pode existir UMA vez entre os tokens
            # ativos e não-resgatados. Tokens já usados ou revogados podem
            # repetir o código sem problema (são histórico).
            models.UniqueConstraint(
                fields=["access_code"],
                condition=models.Q(
                    is_active=True,
                    is_used=False,
                    deleted_at__isnull=True,
                ),
                name="uniq_active_access_code",
            ),
        ]

    def __str__(self):
        return f"PIN {self.access_code} → {self.pet.name}"
