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
