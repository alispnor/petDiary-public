from rest_framework import serializers
from .models import Coupon, Subscription


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


class SubscribeSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=["PIX", "CREDIT_CARD"])
    card_token = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=32)


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "id", "code", "discount_percent", "valid_until",
            "max_uses", "current_uses", "is_active", "is_valid",
            "created_at",
        )
        read_only_fields = ("id", "current_uses", "is_valid", "created_at")
