from django.urls import path
from .views import (
    AdminCouponRedemptionsView,
    AdminCouponDeactivateView, AdminCouponListCreateView,
    AdminKpiView, AdminTicketListView, AdminTicketReplyView,
    AdminUserListView,
)

urlpatterns = [
    path("admin/kpis/", AdminKpiView.as_view(), name="admin-kpis"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/coupons/", AdminCouponListCreateView.as_view(), name="admin-coupons"),
    path("admin/coupons/<uuid:pk>/redemptions/", AdminCouponRedemptionsView.as_view(), name="admin-coupon-redemptions"),
    path("admin/coupons/<uuid:pk>/deactivate/", AdminCouponDeactivateView.as_view(), name="admin-coupon-deactivate"),
    path("admin/tickets/", AdminTicketListView.as_view(), name="admin-tickets"),
    path("admin/tickets/<uuid:pk>/reply/", AdminTicketReplyView.as_view(), name="admin-ticket-reply"),
]
