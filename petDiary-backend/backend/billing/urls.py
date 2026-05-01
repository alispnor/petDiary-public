from django.urls import path
from .views import SubscriptionView, SubscribeView, CancelView

urlpatterns = [
    path("billing/subscription/", SubscriptionView.as_view(), name="billing-subscription"),
    path("billing/subscribe/", SubscribeView.as_view(), name="billing-subscribe"),
    path("billing/cancel/", CancelView.as_view(), name="billing-cancel"),
]
