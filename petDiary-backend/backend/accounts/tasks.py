"""Tarefas assíncronas do app accounts (Celery).

- send_password_reset_email_task: envia o link de redefinição em background;
  mantém a request do /auth/forgot-password/ rápida e isola falhas de SMTP.
- cleanup_expired_password_reset_tokens_task: limpeza periódica (beat) — remove
  tokens já usados ou expirados há mais de 24h. Configurada no
  CELERY_BEAT_SCHEDULE (settings).
"""
from __future__ import annotations

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

log = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
)
def send_password_reset_email_task(self, user_id: str, reset_token_id: str) -> bool:
    """Envia email de redefinição de senha de forma assíncrona.

    Recebe IDs (não objetos) — boa prática Celery: serialização leve e
    tolerante a estado em mudança entre enqueue e execução.
    """
    from .models import PasswordResetToken, User
    from .services.email import build_password_reset_email, get_email_service
    from django.conf import settings

    try:
        user = User.objects.get(pk=user_id, is_active=True)
        reset = PasswordResetToken.objects.get(pk=reset_token_id, user=user)
    except (User.DoesNotExist, PasswordResetToken.DoesNotExist):
        log.warning(
            "password_reset_email_skip", extra={
                "user_id": user_id, "token_id": reset_token_id,
            }
        )
        return False

    base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
    reset_url = f"{base_url.rstrip('/')}/reset-password/{reset.token}"
    subject, body = build_password_reset_email(user, reset_url)
    get_email_service().send(to=user.email, subject=subject, body=body)
    log.info("password_reset_email_sent", extra={"user_id": user_id})
    return True


@shared_task
def cleanup_expired_password_reset_tokens_task() -> int:
    """Remove tokens expirados ou usados há mais de 24h.

    Mantém a tabela enxuta sem perder rastreabilidade recente.
    Roda periodicamente via Celery Beat.
    """
    from .models import PasswordResetToken

    cutoff_used = timezone.now() - timedelta(hours=24)
    qs = PasswordResetToken.objects.filter(
        # já usado há mais de 24h OU expirado (em qualquer momento)
        used_at__lt=cutoff_used,
    ) | PasswordResetToken.objects.filter(
        used_at__isnull=True,
        expires_at__lt=timezone.now(),
    )
    count, _ = qs.distinct().delete()
    log.info("password_reset_tokens_cleaned", extra={"count": count})
    return count
