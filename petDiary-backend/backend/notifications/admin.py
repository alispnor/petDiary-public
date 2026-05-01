from django.contrib import admin

from .models import DevicePushToken, Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "type", "read_at", "created_at")
    list_filter = ("type", "read_at")
    search_fields = ("title", "body", "user__username")
    readonly_fields = ("id", "created_at")


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "push_vaccine", "push_payment_due", "email_enabled")


@admin.register(DevicePushToken)
class DevicePushTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "last_seen", "created_at")
    list_filter = ("platform",)
    readonly_fields = ("id", "created_at", "last_seen")
