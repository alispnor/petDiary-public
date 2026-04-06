from rest_framework import serializers

from .models import HealthRecord


class HealthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthRecord
        fields = (
            "id",
            "pet",
            "author",
            "record_type",
            "title",
            "description",
            "date_occurred",
            "raw_extracted_text",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "author", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class UploadURLSerializer(serializers.Serializer):
    file_name = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100)
