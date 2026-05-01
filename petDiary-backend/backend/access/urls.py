from django.urls import path

from . import views

urlpatterns = [
    path("access/generate-pin/", views.GeneratePinView.as_view(), name="generate-pin"),
    path("access/claim/", views.ClaimAccessView.as_view(), name="claim-access"),
    path("access/tokens/<uuid:token_id>/revoke/",
         views.RevokeAccessView.as_view(), name="revoke-access"),
    path("access/active/", views.ActiveAccessListView.as_view(), name="active-access"),
    path("access/history/", views.AccessHistoryListView.as_view(), name="access-history"),
]
