from django.urls import path

from . import views

urlpatterns = [
    path("access/generate-pin/", views.GeneratePinView.as_view(), name="generate-pin"),
    path("access/claim/", views.ClaimAccessView.as_view(), name="claim-access"),
]
