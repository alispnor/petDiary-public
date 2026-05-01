"""Abstração do Gateway de Pagamento.

Toggle via env BILLING_GATEWAY_MODE:
- mock (default em DEV): retorna dados realistas mas sem cobrar
- asaas: integração com Asaas (stub — implementar quando tiver credenciais)
- mercadopago: idem (stub)

Quando o Ali tiver credenciais reais, basta:
1. Definir BILLING_GATEWAY_MODE=asaas no .env
2. Definir GATEWAY_API_KEY=<chave Asaas>
3. Implementar AsaasGateway.create_subscription/cancel_subscription/verify_webhook

Tudo o que está no front continua funcionando — só muda o backend.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from django.conf import settings
from django.utils import timezone


@dataclass
class CheckoutResult:
    """Resultado de uma tentativa de checkout."""
    gateway_subscription_id: str
    payment_method: str  # "PIX" | "CREDIT_CARD"
    pix_copy_paste: Optional[str] = None
    pix_qr_code_base64: Optional[str] = None
    pix_expires_at: Optional[datetime] = None
    transaction_token: Optional[str] = None
    status: str = "PENDING"  # PENDING | CONFIRMED | FAILED


class PaymentGateway(ABC):
    @abstractmethod
    def create_subscription(self, *, user, payment_method: str, card_token: str = None,
                            coupon_discount_percent: int = 0) -> CheckoutResult: ...

    @abstractmethod
    def cancel_subscription(self, gateway_subscription_id: str) -> bool: ...

    @abstractmethod
    def verify_webhook(self, signature: str, body: bytes) -> bool: ...


class MockPaymentGateway(PaymentGateway):
    """Implementação que simula tudo realisticamente para dev/teste.

    PIX: gera copy-paste e QR code base64 (1px PNG transparente).
    Cartão: gera transaction_token aleatório, sempre retorna sucesso.
    Webhook: aceita qualquer assinatura (assume confirmação imediata).

    Para simular falha de cartão, prefixar card_token com "FAIL_" no front.
    """

    # PNG 1x1 transparente — placeholder válido para QR code
    FAKE_QR_BASE64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )

    def create_subscription(self, *, user, payment_method, card_token=None,
                            coupon_discount_percent=0):
        sub_id = f"mock_sub_{uuid.uuid4().hex[:12]}"
        if payment_method == "PIX":
            return CheckoutResult(
                gateway_subscription_id=sub_id,
                payment_method="PIX",
                pix_copy_paste=(
                    f"00020126580014BR.GOV.BCB.PIX0136{uuid.uuid4()}"
                    f"5204000053039865802BR5913PETDIARY MOCK6009SAO PAULO62070503***6304"
                    f"{secrets.token_hex(2).upper()}"
                ),
                pix_qr_code_base64=self.FAKE_QR_BASE64,
                pix_expires_at=timezone.now() + timedelta(minutes=15),
                status="PENDING",
            )
        else:  # CREDIT_CARD
            # FAIL_ prefix simula falha (útil para testar UX)
            if card_token and card_token.startswith("FAIL_"):
                return CheckoutResult(
                    gateway_subscription_id=sub_id,
                    payment_method="CREDIT_CARD",
                    transaction_token=f"failed_{uuid.uuid4().hex[:8]}",
                    status="FAILED",
                )
            return CheckoutResult(
                gateway_subscription_id=sub_id,
                payment_method="CREDIT_CARD",
                transaction_token=f"mock_tx_{uuid.uuid4().hex[:12]}",
                status="CONFIRMED",
            )

    def cancel_subscription(self, gateway_subscription_id):
        # Mock sempre aceita
        return True

    def verify_webhook(self, signature, body):
        # Mock: aceita tudo. Em produção, o real valida HMAC-SHA256.
        return True


class AsaasGateway(PaymentGateway):
    """Stub para integração com Asaas (https://docs.asaas.com).

    Implementar quando Ali tiver credenciais:
    - settings.GATEWAY_API_KEY
    - HTTP requests para https://www.asaas.com/api/v3/
    - Endpoints: POST /subscriptions, DELETE /subscriptions/{id}, webhook handler
    - Validação HMAC do webhook via header asaas-access-token
    """
    def create_subscription(self, **kwargs):
        raise NotImplementedError("AsaasGateway: implementar com credenciais reais")

    def cancel_subscription(self, gateway_subscription_id):
        raise NotImplementedError("AsaasGateway: implementar com credenciais reais")

    def verify_webhook(self, signature, body):
        raise NotImplementedError("AsaasGateway: implementar com credenciais reais")


class MercadoPagoGateway(PaymentGateway):
    """Stub para integração com Mercado Pago."""
    def create_subscription(self, **kwargs):
        raise NotImplementedError("MercadoPagoGateway: implementar com credenciais reais")

    def cancel_subscription(self, gateway_subscription_id):
        raise NotImplementedError("MercadoPagoGateway: implementar com credenciais reais")

    def verify_webhook(self, signature, body):
        raise NotImplementedError("MercadoPagoGateway: implementar com credenciais reais")


def get_gateway() -> PaymentGateway:
    mode = getattr(settings, "BILLING_GATEWAY_MODE", "mock").lower()
    if mode == "asaas":
        return AsaasGateway()
    if mode == "mercadopago":
        return MercadoPagoGateway()
    return MockPaymentGateway()


def calculate_pro_price(coupon_discount_percent: int = 0) -> dict:
    base = float(getattr(settings, "SUBSCRIPTION_PRO_PRICE_BRL", 14.90))
    if coupon_discount_percent:
        discount = base * (coupon_discount_percent / 100)
        return {
            "base_price": f"{base:.2f}",
            "discount_amount": f"{discount:.2f}",
            "final_price": f"{base - discount:.2f}",
            "discount_percent": coupon_discount_percent,
        }
    return {
        "base_price": f"{base:.2f}",
        "discount_amount": "0.00",
        "final_price": f"{base:.2f}",
        "discount_percent": 0,
    }
