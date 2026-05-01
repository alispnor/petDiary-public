"""Endpoints do painel administrativo."""
from datetime import timedelta

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from billing.coupon_models import Coupon
from billing.models import Subscription
from billing.serializers import CouponSerializer

from .permissions import IsAdminRole


class AdminKpiView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_users = User.objects.filter(is_active=True).count()
        new_users_30d = User.objects.filter(
            is_active=True, date_joined__gte=thirty_days_ago,
        ).count()

        pro_subs = Subscription.objects.filter(
            plan_type=Subscription.Plan.PRO,
            status=Subscription.Status.ACTIVE,
        ).count()
        canceled_30d = Subscription.objects.filter(
            status=Subscription.Status.CANCELED,
            updated_at__gte=thirty_days_ago,
        ).count()

        from billing.services.gateway import calculate_pro_price
        price = float(calculate_pro_price(0)["base_price"])
        mrr = pro_subs * price

        return Response({
            "mrr_brl": f"{mrr:.2f}",
            "total_users": total_users,
            "new_users_30d": new_users_30d,
            "pro_active": pro_subs,
            "canceled_30d": canceled_30d,
            "churn_rate": (canceled_30d / pro_subs * 100) if pro_subs else 0,
            "tickets_pending": 0,  # Spec 03 ainda não tem SupportTicket model
        })


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = User.objects.all().order_by("-date_joined")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(full_name__icontains=q) |
                Q(email__icontains=q)
            )
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()[:100]
        data = [
            {
                "id": str(u.id),
                "username": u.username,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "date_joined": u.date_joined.isoformat(),
                "plan_type": getattr(getattr(u, "subscription", None), "plan_type", "FREE"),
            }
            for u in qs
        ]
        return Response({"count": len(data), "results": data})


class AdminCouponListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    serializer_class = CouponSerializer
    queryset = Coupon.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminCouponDeactivateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        coupon.is_active = False
        coupon.save(update_fields=["is_active"])
        return Response(CouponSerializer(coupon).data)


class AdminTicketListView(APIView):
    """STUB — Spec 03 ainda não tem SupportTicket model."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response({"count": 0, "results": [], "note": "Spec 03 (suporte) ainda não implementada"})


class AdminTicketReplyView(APIView):
    """STUB — Spec 03 ainda não tem SupportTicket model."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        return Response(
            {"detail": "Spec 03 (suporte) ainda não implementada"},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
