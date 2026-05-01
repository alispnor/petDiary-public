"""Configuração de logging estruturado (structlog).

Em DEBUG: console legível (com cores).
Em produção: JSON para ingestão por agregadores (CloudWatch, Datadog, etc.).
"""
import logging
import sys

import structlog


def configure_structlog(*, debug: bool):
    if debug:
        renderer = structlog.dev.ConsoleRenderer(colors=True)
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    handler = logging.StreamHandler(sys.stdout)
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO if not debug else logging.DEBUG)


# DICT-style LOGGING para Django integrar
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "key_value": {"format": "%(levelname)s [%(name)s] %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "key_value",
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "petdiary": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "audit": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
