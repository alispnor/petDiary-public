from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HealthRecordViewSet

router = DefaultRouter()
router.register("health-records", HealthRecordViewSet, basename="health-record")

urlpatterns = [
    path("pets/<uuid:pet_pk>/", include(router.urls)),
]
