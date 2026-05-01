from rest_framework import serializers

from .models import VetAccessToken


class VetAccessTokenSerializer(serializers.ModelSerializer):
    expires_at = serializers.DateTimeField(required=False)

    class Meta:
        model = VetAccessToken
        fields = (
            "id",
            "pet",
            "vet",
            "access_code",
            "expires_at",
            "is_active",
            "is_used",
            "created_at",
        )
        read_only_fields = (
            "id",
            "vet",
            "access_code",
            "is_active",
            "is_used",
            "created_at",
        )


class ClaimAccessSerializer(serializers.Serializer):
    access_code = serializers.CharField(max_length=6, min_length=6)
