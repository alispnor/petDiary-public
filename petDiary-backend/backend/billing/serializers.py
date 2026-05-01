from rest_framework import serializers
from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    is_pro_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = (
            "id", "plan_type", "status", "current_period_end",
            "cancel_at_period_end", "is_pro_active",
            "created_at", "updated_at",
        )
        read_only_fields = fields
