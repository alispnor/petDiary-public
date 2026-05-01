from django.urls import path
from .views import PetAuditListView

urlpatterns = [
    path("pets/<uuid:pet_pk>/audit/", PetAuditListView.as_view(), name="pet-audit"),
]
