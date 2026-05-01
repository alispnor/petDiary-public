"""Inicializa structlog antes de qualquer import do Django.

Também garante que o app Celery seja carregado quando Django arranca, pra que
a decoração `@shared_task` funcione em qualquer módulo de `tasks.py`.
"""
from .logging_config import configure_structlog

# Configuração via variáveis de ambiente (lê DEBUG diretamente, sem dj-database-url ainda)
import os
configure_structlog(debug=os.environ.get("DEBUG", "False").lower() == "true")

from .celery import app as celery_app  # noqa: E402

__all__ = ("celery_app",)
