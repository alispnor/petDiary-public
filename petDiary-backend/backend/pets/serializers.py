from rest_framework import serializers

from .models import Pet


class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = (
            "id",
            "tutor",
            "name",
            "species",
            "breed",
            "weight_kg",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "tutor", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["tutor"] = self.context["request"].user
        return super().create(validated_data)
