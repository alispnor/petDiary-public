from django.contrib import admin
from .models import Coupon, Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan_type", "status", "current_period_end", "cancel_at_period_end")
    list_filter = ("plan_type", "status", "cancel_at_period_end")
    search_fields = ("user__username", "user__full_name", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_percent", "valid_until", "current_uses", "max_uses", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code",)
    actions = ["deactivate_coupons"]

    def deactivate_coupons(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_coupons.short_description = "Desativar cupons selecionados"
