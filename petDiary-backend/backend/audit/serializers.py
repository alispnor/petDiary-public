from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = (
            "id", "action", "actor", "actor_name_snapshot",
            "actor_role_snapshot", "entity_type", "entity_id",
            "description", "changes", "created_at",
        )
        read_only_fields = fields
