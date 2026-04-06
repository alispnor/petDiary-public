from django.contrib import admin

from .models import VetAccessToken


@admin.register(VetAccessToken)
class VetAccessTokenAdmin(admin.ModelAdmin):
    list_display = ("access_code", "pet", "vet", "is_active", "is_used", "expires_at")
    list_filter = ("is_active", "is_used")
