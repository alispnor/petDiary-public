import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    # Local
    "accounts",
    "pets",
    "health",
    "access",
    "audit",
    "billing",
    "admin_panel",
    "notifications",
    "django_celery_beat",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Logging contextual — DEPOIS do AuthenticationMiddleware
    "petdiary.middleware.StructlogContextMiddleware",
]

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)

ROOT_URLCONF = "petdiary.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "petdiary.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default="postgres://petdiary:petdiary@db:5432/petdiary",
        conn_max_age=600,
    )
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# i18n
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Ordem de prioridade definida pelo Ali em 2026-05-01 (decisão durável):
# 1º pt-br (default), 2º es, 3º pt-pt, 4º en, 5º fr, 6º ar (RTL — nativo do Ali)
LANGUAGES = [
    ("pt-br", "Português (Brasil)"),
    ("es", "Español"),
    ("pt-pt", "Português (Portugal)"),
    ("en", "English"),
    ("fr", "Français"),
    ("ar", "العربية"),  # RTL — exige tratamento especial no frontend
]

LOCALE_PATHS = [
    BASE_DIR / "locale",
]

# Static
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media (uploads de attachments)
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Backend de storage para attachments — "local" (default) ou "s3" (futuro)
ATTACHMENT_STORAGE_BACKEND = config("ATTACHMENT_STORAGE_BACKEND", default="local")

# Gateway de pagamento — "mock" (default DEV) | "asaas" | "mercadopago"
BILLING_GATEWAY_MODE = config("BILLING_GATEWAY_MODE", default="mock")
GATEWAY_API_KEY = config("GATEWAY_API_KEY", default="")
GATEWAY_WEBHOOK_SECRET = config("GATEWAY_WEBHOOK_SECRET", default="")
SUBSCRIPTION_PRO_PRICE_BRL = config("SUBSCRIPTION_PRO_PRICE_BRL", default=14.90, cast=float)

# IA — "mock" (default) | "openai"
AI_PROVIDER = config("AI_PROVIDER", default="mock")
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
OPENAI_MODEL_TEXT = config("OPENAI_MODEL_TEXT", default="gpt-4o-mini")
OPENAI_MODEL_AUDIO = config("OPENAI_MODEL_AUDIO", default="whisper-1")

# Email transacional — "console" (loga em dev) | "smtp" | "resend"
EMAIL_PROVIDER = config("EMAIL_PROVIDER", default="console")
EMAIL_FROM = config("EMAIL_FROM", default="noreply@petdiary.com.br")
FRONTEND_BASE_URL = config("FRONTEND_BASE_URL", default="http://localhost:5173")

# === Celery (broker + backend = Redis) ===
# `redis://redis:6379/0` no docker-compose; CELERY_TASK_ALWAYS_EAGER=True
# em testes/CI roda tudo síncrono sem precisar de worker.
REDIS_URL = config("REDIS_URL", default="redis://redis:6379/0")
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default=REDIS_URL)
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default=REDIS_URL)
CELERY_TASK_ALWAYS_EAGER = config("CELERY_TASK_ALWAYS_EAGER", default=False, cast=bool)
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Schedule default — registrado em código (não-DB) como bootstrap.
# DatabaseScheduler também aceita entries no settings; se admin editar
# pelo painel /admin/django_celery_beat/, prevalece o do DB.
CELERY_BEAT_SCHEDULE = {
    "cleanup-expired-password-reset-tokens": {
        "task": "accounts.tasks.cleanup_expired_password_reset_tokens_task",
        "schedule": 3600.0,  # a cada 1h
    },
    "check-payment-due-daily": {
        "task": "notifications.tasks.check_payment_due_task",
        "schedule": 86400.0,  # 1x/dia
    },
}

# Push notifications — mock-first toggleable
PUSH_SERVICE_MODE = config("PUSH_SERVICE_MODE", default="mock")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Throttling — protege endpoints sensíveis de brute-force / abuso
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Auth — anônimos
        "login": "10/min",                 # /auth/token/
        "register": "5/min",               # /auth/register/
        "forgot_password": "5/hour",       # /auth/forgot-password/ (anti-enumeração + flood)
        "reset_password": "10/hour",       # /auth/reset-password/
        "check_username": "30/min",        # /auth/check-username/ (autocomplete)
        # Billing — autenticados
        "apply_coupon": "20/hour",         # /billing/apply-coupon/
    },
}

# SimpleJWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    # Rotation + blacklist: cada uso do refresh emite novo refresh
    # e invalida o anterior, bloqueando reuso (defesa contra roubo).
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# drf-spectacular
SPECTACULAR_SETTINGS = {
    "TITLE": "PetDiary API",
    "DESCRIPTION": "API para o sistema PetDiary - MVP Fase 1",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
