"""Endpoints de Billing (Subscription + Coupon + Webhook)."""
import json

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from audit.helpers import log_action

from .models import Coupon, Subscription
from .serializers import (
    ApplyCouponSerializer, CouponSerializer, SubscribeSerializer, SubscriptionSerializer,
)
from .services.gateway import calculate_pro_price, get_gateway


# ─────────── Subscription ───────────

class SubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sub, _created = Subscription.objects.get_or_create(
            user=request.user,
            defaults={"plan_type": Subscription.Plan.FREE},
        )
        return Response(SubscriptionSerializer(sub).data)


class SubscribeView(APIView):
    """POST /billing/subscribe/ — cria checkout (PIX ou cartão).

    Em modo mock retorna PIX/transaction_token fake; em produção usa Asaas/MP.
    O caller pode passar `coupon_code` opcional.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = SubscribeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        method = ser.validated_data["payment_method"]
        card_token = ser.validated_data.get("card_token", "")
        coupon_code = ser.validated_data.get("coupon_code", "").strip().upper()

        # Aplicar cupom (race-safe)
        coupon_discount = 0
        coupon = None
        if coupon_code:
            with transaction.atomic():
                coupon = (
                    Coupon.objects.select_for_update()
                    .filter(code=coupon_code).first()
                )
                if not coupon or not coupon.is_valid:
                    return Response(
                        {"detail": _("Cupom inválido ou expirado.")},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                coupon_discount = coupon.discount_percent
                # Incrementa uso (commit do atomic)
                coupon.current_uses = coupon.current_uses + 1
                coupon.save(update_fields=["current_uses"])

        gateway = get_gateway()
        result = gateway.create_subscription(
            user=request.user,
            payment_method=method,
            card_token=card_token,
            coupon_discount_percent=coupon_discount,
        )

        # Atualizar Subscription local
        sub, _ = Subscription.objects.get_or_create(user=request.user)
        sub.gateway_subscription_id = result.gateway_subscription_id
        if result.status == "CONFIRMED":
            sub.plan_type = Subscription.Plan.PRO
            sub.status = Subscription.Status.ACTIVE
        else:
            sub.status = Subscription.Status.TRIALING  # aguardando confirmação
        sub.save()

        log_action(
            actor=request.user, action="CREATE",
            entity_type="Subscription", entity_id=sub.id,
            description=f"Iniciou checkout {method}" + (f" com cupom {coupon_code}" if coupon else ""),
            request=request,
        )

        prices = calculate_pro_price(coupon_discount)
        return Response({
            "subscription": SubscriptionSerializer(sub).data,
            "checkout": {
                "method": result.payment_method,
                "status": result.status,
                "pix_copy_paste": result.pix_copy_paste,
                "pix_qr_code_base64": result.pix_qr_code_base64,
                "pix_expires_at": result.pix_expires_at.isoformat() if result.pix_expires_at else None,
                "transaction_token": result.transaction_token,
            },
            "pricing": prices,
        }, status=status.HTTP_201_CREATED)


class CancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        sub = Subscription.objects.filter(user=request.user).first()
        if not sub or sub.plan_type != Subscription.Plan.PRO:
            return Response(
                {"detail": _("Você não tem assinatura ativa para cancelar.")},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Avisa o gateway
        if sub.gateway_subscription_id:
            try:
                get_gateway().cancel_subscription(sub.gateway_subscription_id)
            except NotImplementedError:
                pass  # mock ou stub — apenas marca local
        sub.cancel_at_period_end = True
        sub.save(update_fields=["cancel_at_period_end", "updated_at"])
        log_action(
            actor=request.user, action="UPDATE",
            entity_type="Subscription", entity_id=sub.id,
            description="Cancelou renovação automática",
            request=request,
        )
        return Response(SubscriptionSerializer(sub).data)


# ─────────── Cupom ───────────

class ApplyCouponView(APIView):
    """POST /billing/apply-coupon/ — apenas valida o cupom + retorna preço com desconto.

    Não consome o cupom (current_uses só é incrementado quando o user finaliza
    o checkout em /subscribe/).
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]  # anti-bruteforce

    def post(self, request):
        ser = ApplyCouponSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        code = ser.validated_data["code"].strip().upper()

        coupon = Coupon.objects.filter(code=code).first()
        if not coupon or not coupon.is_valid:
            return Response(
                {"detail": _("Cupom inválido ou expirado.")},
                status=status.HTTP_404_NOT_FOUND,
            )

        prices = calculate_pro_price(coupon.discount_percent)
        return Response({
            "code": coupon.code,
            "discount_percent": coupon.discount_percent,
            **prices,
        })


# ─────────── Webhook ───────────

class GatewayWebhookView(APIView):
    """POST /webhooks/gateway/ — recebe eventos do gateway (sem auth JWT)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        signature = request.headers.get("X-Webhook-Signature", "")
        body = request.body
        gateway = get_gateway()

        if not gateway.verify_webhook(signature, body):
            return Response({"detail": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = json.loads(body or b"{}")
        except json.JSONDecodeError:
            return Response({"detail": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        event_type = payload.get("event") or payload.get("type", "")
        sub_id = payload.get("subscription_id") or payload.get("subscription", {}).get("id")

        if not sub_id:
            return Response({"detail": "Missing subscription_id"}, status=status.HTTP_400_BAD_REQUEST)

        sub = Subscription.objects.filter(gateway_subscription_id=sub_id).first()
        if not sub:
            return Response({"detail": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)

        # Roteamento mínimo de eventos
        if event_type in ("payment.confirmed", "subscription.activated"):
            sub.plan_type = Subscription.Plan.PRO
            sub.status = Subscription.Status.ACTIVE
            sub.save()
        elif event_type in ("payment.overdue",):
            sub.status = Subscription.Status.PAST_DUE
            sub.save()
        elif event_type in ("subscription.canceled",):
            sub.status = Subscription.Status.CANCELED
            sub.cancel_at_period_end = True
            sub.save()

        return Response({"received": True, "event": event_type})
