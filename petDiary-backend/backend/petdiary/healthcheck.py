"""Endpoints de saúde para o orquestrador (k8s, Caddy, monitor externo).

- GET /livez/   — está vivo? (process responde — não verifica dependências)
- GET /healthz/ — está pronto? (testa DB e Redis; 200 ou 503)

Sem auth — supõe-se que a porta seja exposta apenas internamente em prod.
"""
from __future__ import annotations

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET


@require_GET
@never_cache
@csrf_exempt
def livez(_request):
    """Liveness — só responde 200 se o processo está vivo."""
    return JsonResponse({"status": "ok"})


@require_GET
@never_cache
@csrf_exempt
def healthz(_request):
    """Readiness — checa dependências críticas. 200 se tudo ok, 503 caso contrário."""
    checks: dict[str, dict[str, str | bool]] = {}

    # Postgres
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = {"ok": True}
    except Exception as exc:
        checks["database"] = {"ok": False, "error": str(exc)[:200]}

    # Redis (broker da Celery — opcional na inicialização)
    try:
        from celery import current_app
        ping = current_app.connection_for_read().ensure_connection(
            max_retries=1, timeout=2,
        )
        ping.close()
        checks["redis"] = {"ok": True}
    except Exception as exc:
        checks["redis"] = {"ok": False, "error": str(exc)[:200]}

    all_ok = all(c.get("ok") for c in checks.values())
    return JsonResponse(
        {"status": "ok" if all_ok else "degraded", "checks": checks},
        status=200 if all_ok else 503,
    )
