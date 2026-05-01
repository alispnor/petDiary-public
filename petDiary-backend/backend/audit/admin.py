from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "actor_name_snapshot", "entity_type", "pet", "description")
    list_filter = ("action", "entity_type", "actor_role_snapshot")
    search_fields = ("actor_name_snapshot", "description", "entity_type")
    readonly_fields = (
        "actor", "actor_name_snapshot", "actor_role_snapshot",
        "action", "entity_type", "entity_id", "pet",
        "description", "changes", "ip_address", "user_agent", "created_at",
    )
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False  # logs são criados via API/signals, não via admin

    def has_change_permission(self, request, obj=None):
        return False  # imutável

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser  # só superuser pode purgar
