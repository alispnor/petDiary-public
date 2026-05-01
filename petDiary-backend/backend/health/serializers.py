from rest_framework import serializers

from .models import HealthRecord, Reminder


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
        # pet vem da URL aninhada (/pets/<pet_pk>/health-records/), não do body
        read_only_fields = ("id", "pet", "author", "created_at", "updated_at")


class UploadURLSerializer(serializers.Serializer):
    file_name = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100)


class ReminderSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Reminder
        fields = (
            "id",
            "pet",
            "health_record",
            "type",
            "title",
            "description",
            "date_due",
            "notified_at",
            "dismissed_at",
            "is_active",
            "created_at",
        )
        read_only_fields = (
            "id",
            "pet",
            "notified_at",
            "dismissed_at",
            "is_active",
            "created_at",
        )
