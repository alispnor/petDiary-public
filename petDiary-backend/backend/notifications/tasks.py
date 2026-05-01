"""Tasks Celery do app notifications.

- `send_push_async`: fanout — pega tokens do user e despacha pra Expo +
  WebPush conforme platform
- `check_payment_due_task`: beat diário — avisa subs PRO com vencimento
  em 3 dias
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import DevicePushToken
from .services.push import get_push_service

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_push_async(
    self,
    user_id: str,
    notif_type: str,
    title: str,
    body: str,
    data: dict,
) -> dict:
    """Envia push para todos os devices do user, fanout por plataforma."""
    tokens_qs = DevicePushToken.objects.filter(user_id=user_id)

    expo_tokens = list(
        tokens_qs.filter(
            platform__in=[
                DevicePushToken.Platform.IOS,
                DevicePushToken.Platform.ANDROID,
            ]
        ).values_list("expo_push_token", flat=True)
    )
    expo_tokens = [t for t in expo_tokens if t]

    web_subs = [
        {
            "endpoint": tok.web_push_endpoint,
            "keys": {
                "p256dh": tok.web_push_p256dh,
                "auth": tok.web_push_auth,
            },
        }
        for tok in tokens_qs.filter(platform=DevicePushToken.Platform.WEB)
        if tok.web_push_endpoint
    ]

    if not expo_tokens and not web_subs:
        return {"sent": 0, "reason": "no_tokens"}

    service = get_push_service()
    result = {"expo": None, "web": None}

    if expo_tokens:
        result["expo"] = service.send_expo(expo_tokens, title, body, data)
    if web_subs:
        result["web"] = service.send_web(web_subs, title, body, data)

    # Limpeza de subs caducadas (sem token de auth)
    web_result = result["web"] or {}
    gone = web_result.get("gone_endpoints") or []
    if gone:
        deleted, _ = DevicePushToken.objects.filter(
            web_push_endpoint__in=gone
        ).delete()
        logger.info("removidos %s tokens caducados", deleted)

    return result


@shared_task
def check_payment_due_task() -> dict:
    """Beat 1x/dia. Avisa subs PRO com current_period_end em 3 dias.

    Idempotente: se rodar mais de 1x no mesmo dia, criaria notif duplicada.
    Mitigação: filtrar por created_at do dia em Notification antes de criar.
    """
    from billing.models import Subscription

    from .helpers import notify

    target_date = (timezone.now() + timedelta(days=3)).date()
    qs = Subscription.objects.filter(
        plan_type=Subscription.Plan.PRO,
        status=Subscription.Status.ACTIVE,
        cancel_at_period_end=False,
        current_period_end__date=target_date,
    ).select_related("user")

    sent = 0
    for sub in qs:
        notify(
            sub.user,
            "PAYMENT_DUE",
            "Sua assinatura PRO renova em 3 dias",
            "Vamos cobrar via PIX. Toque para detalhes.",
            data={"screen": "Subscription"},
        )
        sent += 1

    return {"checked": qs.count(), "notified": sent, "target_date": str(target_date)}
