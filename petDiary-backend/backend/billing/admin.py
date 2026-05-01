from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan_type", "status", "current_period_end", "cancel_at_period_end")
    list_filter = ("plan_type", "status", "cancel_at_period_end")
    search_fields = ("user__username", "user__full_name", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")
