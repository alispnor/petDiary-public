"""Tasks Celery do app health.

- `check_reminders_task`: beat 1x/dia. Varre Reminders com
  `date_due <= today + 7d`, ainda não notificados e não descartados.
  Envia notify() para todos os OWNERs do pet e marca `notified_at`.
"""
import logging
from datetime import date, timedelta

from celery import shared_task
from django.utils import timezone

from .models import Reminder

logger = logging.getLogger(__name__)


_TYPE_TO_NOTIF = {
    Reminder.Type.VACCINE: "VACCINE",
    Reminder.Type.VET_RETURN: "VET_RETURN",
    Reminder.Type.CUSTOM: "SYSTEM",
}


def _format_due_label(date_due: date) -> str:
    today = date.today()
    delta = (date_due - today).days
    if delta < 0:
        return f"venceu há {abs(delta)} dia(s)"
    if delta == 0:
        return "hoje"
    if delta == 1:
        return "amanhã"
    return f"em {delta} dias"


@shared_task
def check_reminders_task(window_days: int = 7) -> dict:
    """Notifica reminders próximos do vencimento.

    Args:
        window_days: quantos dias à frente entram no aviso (default 7)
    """
    from notifications.helpers import notify
    from pets.models import PetMember

    target = date.today() + timedelta(days=window_days)
    qs = Reminder.objects.filter(
        date_due__lte=target,
        notified_at__isnull=True,
        dismissed_at__isnull=True,
    ).select_related("pet")

    notified = 0
    skipped = 0
    for r in qs:
        owners = PetMember.objects.filter(
            pet=r.pet, role=PetMember.Role.OWNER
        ).select_related("user")
        if not owners.exists():
            skipped += 1
            continue

        notif_type = _TYPE_TO_NOTIF.get(r.type, "SYSTEM")
        due_label = _format_due_label(r.date_due)
        title = f"{r.title} — {due_label}"
        body = r.description or f"Lembrete agendado para {r.date_due.isoformat()}."

        for m in owners:
            notify(
                m.user,
                notif_type,
                title,
                body,
                data={
                    "screen": "PetDashboard",
                    "petId": str(r.pet.id),
                    "reminderId": str(r.id),
                },
            )
        r.notified_at = timezone.now()
        r.save(update_fields=["notified_at"])
        notified += 1

    return {
        "checked": qs.count() + notified,
        "notified": notified,
        "skipped": skipped,
        "window_days": window_days,
    }
