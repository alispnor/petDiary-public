from django.contrib import admin

from .models import HealthRecord, Reminder


@admin.register(HealthRecord)
class HealthRecordAdmin(admin.ModelAdmin):
    list_display = ("title", "pet", "record_type", "date_occurred", "author")
    list_filter = ("record_type",)
    search_fields = ("title",)


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("title", "pet", "type", "date_due", "notified_at", "dismissed_at")
    list_filter = ("type", "dismissed_at")
    search_fields = ("title", "description")
    readonly_fields = ("id", "created_at", "notified_at")
