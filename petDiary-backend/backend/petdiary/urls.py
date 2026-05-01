from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import PetDiaryTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth (JWT) — custom view aplica login único para VET
    path("api/v1/auth/token/", PetDiaryTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Apps
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("pets.urls")),
    path("api/v1/", include("health.urls")),
    path("api/v1/", include("access.urls")),
    path("api/v1/", include("audit.urls")),
    path("api/v1/", include("billing.urls")),
    path("api/v1/", include("admin_panel.urls")),
    # Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
