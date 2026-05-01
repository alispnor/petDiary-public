"""Email transacional abstraído.

Toggle EMAIL_PROVIDER:
- console (default DEV): apenas loga no stdout
- smtp: envia via Django mail (config SMTP)
- resend: stub (implementar quando tiver API key)
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod

from django.conf import settings
from django.core.mail import send_mail


log = logging.getLogger(__name__)


class EmailService(ABC):
    @abstractmethod
    def send(self, *, to: str, subject: str, body: str, html_body: str = "") -> bool: ...


class ConsoleEmailService(EmailService):
    def send(self, *, to, subject, body, html_body=""):
        log.info("email_console", extra={"to": to, "subject": subject})
        print("=" * 60, flush=True)
        print(f"📧 EMAIL (console mock) -> {to}", flush=True)
        print(f"   Assunto: {subject}", flush=True)
        print("-" * 60, flush=True)
        print(body, flush=True)
        print("=" * 60, flush=True)
        return True


class SmtpEmailService(EmailService):
    def send(self, *, to, subject, body, html_body=""):
        send_mail(
            subject=subject,
            message=body,
            html_message=html_body or None,
            from_email=getattr(settings, "EMAIL_FROM", "noreply@petdiary.com.br"),
            recipient_list=[to],
            fail_silently=True,
        )
        return True


class ResendEmailService(EmailService):
    """Stub. Implementar quando Ali tiver RESEND_API_KEY."""
    def send(self, *, to, subject, body, html_body=""):
        raise NotImplementedError("ResendEmailService: implementar com RESEND_API_KEY")


def get_email_service() -> EmailService:
    provider = getattr(settings, "EMAIL_PROVIDER", "console").lower()
    if provider == "smtp":
        return SmtpEmailService()
    if provider == "resend":
        return ResendEmailService()
    return ConsoleEmailService()


def build_password_reset_email(user, reset_url: str) -> tuple[str, str]:
    subject = "PetDiary — Redefinição de senha"
    body = (
        f"Olá {user.full_name or user.username},\n\n"
        f"Você solicitou a redefinição da sua senha no PetDiary.\n"
        f"Acesse o link abaixo para criar uma nova senha (válido por 30 minutos):\n\n"
        f"{reset_url}\n\n"
        f"Se você não solicitou esta troca, ignore este email — sua senha não será alterada.\n\n"
        f"— Equipe PetDiary"
    )
    return subject, body
