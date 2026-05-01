"""Endpoints de Subscription. POST /subscribe/ ainda é stub (501)
até integração com gateway."""
from django.utils.translation import gettext_lazy as _
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription
from .serializers import SubscriptionSerializer


class SubscriptionView(APIView):
    """GET /api/v1/billing/subscription/ — retorna a assinatura do user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sub, _created = Subscription.objects.get_or_create(
            user=request.user,
            defaults={"plan_type": Subscription.Plan.FREE},
        )
        return Response(SubscriptionSerializer(sub).data)


class SubscribeView(APIView):
    """POST /billing/subscribe/ — STUB. Integração com gateway é Spec 01."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "detail": _(
                    "Pagamentos ainda não disponíveis. "
                    "Estamos preparando a integração — em breve."
                ),
                "implemented": False,
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class CancelView(APIView):
    """POST /billing/cancel/ — marca cancel_at_period_end=True.

    Usuário continua PRO até o final do período já pago. Não cobra mais
    a partir da próxima renovação.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        sub = Subscription.objects.filter(user=request.user).first()
        if not sub or sub.plan_type != Subscription.Plan.PRO:
            return Response(
                {"detail": _("Você não tem assinatura ativa para cancelar.")},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sub.cancel_at_period_end = True
        sub.save(update_fields=["cancel_at_period_end", "updated_at"])
        return Response(SubscriptionSerializer(sub).data)
