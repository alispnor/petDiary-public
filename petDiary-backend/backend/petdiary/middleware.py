"""Middleware que adiciona contexto da request ao structlog.

Cada log dentro do ciclo da request inclui automaticamente: request_id,
user_id e role (se autenticado).
"""
import uuid

import structlog
from audit.signals import set_current_user


class StructlogContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            structlog.contextvars.bind_contextvars(
                user_id=str(user.id),
                role=getattr(user, "role", ""),
            )
            set_current_user(user)
        else:
            set_current_user(None)

        try:
            response = self.get_response(request)
        finally:
            structlog.contextvars.clear_contextvars()
            set_current_user(None)

        response["X-Request-ID"] = request_id
        return response
