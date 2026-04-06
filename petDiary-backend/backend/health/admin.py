from django.contrib import admin

from .models import HealthRecord


@admin.register(HealthRecord)
class HealthRecordAdmin(admin.ModelAdmin):
    list_display = ("title", "pet", "record_type", "date_occurred", "author")
    list_filter = ("record_type",)
    search_fields = ("title",)
