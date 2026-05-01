from django.urls import path
from .views import (
    ApplyCouponView, CancelView, GatewayWebhookView,
    SubscribeView, SubscriptionView,
)

urlpatterns = [
    path("billing/subscription/", SubscriptionView.as_view(), name="billing-subscription"),
    path("billing/subscribe/", SubscribeView.as_view(), name="billing-subscribe"),
    path("billing/cancel/", CancelView.as_view(), name="billing-cancel"),
    path("billing/apply-coupon/", ApplyCouponView.as_view(), name="billing-apply-coupon"),
    path("webhooks/gateway/", GatewayWebhookView.as_view(), name="billing-webhook"),
]
