"""Helpers para registrar entradas de auditoria a partir de qualquer parte do app.

Uso típico:
    from audit.helpers import log_action
    log_action(actor=request.user, action="CREATE", entity=health_record,
               pet=health_record.pet, description="Adicionou nota Consulta")
"""
from typing import Any, Optional

from django.contrib.auth.models import AnonymousUser

from .models import AuditLog


def log_action(
    *,
    actor: Optional[Any],
    action: str,
    entity: Optional[Any] = None,
    entity_type: str = "",
    entity_id=None,
    pet=None,
    description: str = "",
    changes: Optional[dict] = None,
    request=None,
) -> Optional[AuditLog]:
    """Cria uma entrada de AuditLog. Falha silenciosa em log."""
    if isinstance(actor, AnonymousUser) or actor is None:
        actor_obj, name, role = None, "Sistema", "SYSTEM"
    else:
        actor_obj = actor
        name = getattr(actor, "full_name", "") or actor.username or str(actor.id)
        role = getattr(actor, "role", "")

    if entity is not None:
        entity_type = entity_type or entity.__class__.__name__
        entity_id = entity_id or getattr(entity, "id", None)

    ip = ""
    user_agent = ""
    if request is not None:
        ip = (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR", "")
        )
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]

    try:
        return AuditLog.objects.create(
            actor=actor_obj,
            actor_name_snapshot=name[:255],
            actor_role_snapshot=role,
            action=action,
            entity_type=entity_type[:50],
            entity_id=entity_id,
            pet=pet,
            description=description[:500],
            changes=changes or {},
            ip_address=ip or None,
            user_agent=user_agent,
        )
    except Exception:
        # Auditoria nunca pode quebrar o fluxo principal
        import logging
        logging.getLogger(__name__).exception("audit log failed")
        return None
