"""Helper público — qualquer parte do código chama `notify(...)` para
disparar uma notificação in-app + push (se preferência permitir).

Falha silenciosamente em caso de erro inesperado para não derrubar a
operação principal (igual `audit.helpers.log_action`).
"""
import logging

from django.contrib.auth import get_user_model

from .models import Notification, NotificationPreference

logger = logging.getLogger(__name__)
User = get_user_model()


def notify(
    user,
    type: str,
    title: str,
    body: str,
    data: dict | None = None,
    push: bool = True,
) -> Notification | None:
    """Cria Notification + dispara task assíncrona de push se `push=True`.

    Args:
        user: instance ou id do User destinatário
        type: um de Notification.Type.choices
        title: título curto (≤140 chars)
        body: texto da notificação
        data: payload JSON (deep-link, ids, etc.)
        push: se False, só persiste in-app sem disparar push

    Retorna:
        A Notification criada, ou None se houve erro silencioso.
    """
    try:
        # Aceita user instance OU id
        user_obj = user if hasattr(user, "id") else User.objects.get(pk=user)

        prefs, _ = NotificationPreference.objects.get_or_create(user=user_obj)
        push_allowed = push and prefs.allows(type)

        notif = Notification.objects.create(
            user=user_obj,
            type=type,
            title=title[:140],
            body=body,
            data=data or {},
        )

        if push_allowed:
            try:
                from .tasks import send_push_async

                send_push_async.delay(
                    str(user_obj.id), type, title, body, data or {}
                )
            except Exception as e:
                logger.warning("não foi possível agendar push: %s", e)

        return notif
    except Exception as e:
        logger.exception("notify() falhou silenciosamente: %s", e)
        return None
