from django.urls import path
from rest_framework.routers import DefaultRouter

from .member_views import PetMemberDestroyView, PetMemberListCreateView
from .views import PetViewSet

router = DefaultRouter()
router.register("pets", PetViewSet, basename="pet")

urlpatterns = router.urls + [
    path("pets/<uuid:pet_pk>/members/",
         PetMemberListCreateView.as_view(), name="pet-members"),
    path("pets/<uuid:pet_pk>/members/<uuid:member_id>/",
         PetMemberDestroyView.as_view(), name="pet-member-detail"),
]
