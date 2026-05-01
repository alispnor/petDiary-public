from rest_framework import serializers

from .models import DevicePushToken, Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "id", "type", "title", "body", "data",
            "read_at", "is_read", "created_at",
        )
        read_only_fields = fields

    def get_is_read(self, obj) -> bool:
        return obj.read_at is not None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        exclude = ("user", "updated_at")


class DeviceRegisterSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=DevicePushToken.Platform.choices)
    expo_push_token = serializers.CharField(required=False, allow_blank=True, max_length=255)
    web_push_endpoint = serializers.URLField(required=False, allow_blank=True, max_length=500)
    web_push_p256dh = serializers.CharField(required=False, allow_blank=True, max_length=255)
    web_push_auth = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate(self, attrs):
        platform = attrs["platform"]
        if platform == DevicePushToken.Platform.WEB:
            if not (
                attrs.get("web_push_endpoint")
                and attrs.get("web_push_p256dh")
                and attrs.get("web_push_auth")
            ):
                raise serializers.ValidationError(
                    "Web Push exige endpoint + p256dh + auth."
                )
        else:
            if not attrs.get("expo_push_token"):
                raise serializers.ValidationError(
                    "iOS/Android exige expo_push_token."
                )
        return attrs


class DeviceUnregisterSerializer(serializers.Serializer):
    expo_push_token = serializers.CharField(required=False, allow_blank=True)
    web_push_endpoint = serializers.URLField(required=False, allow_blank=True)
