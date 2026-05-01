from django.utils import timezone
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
            "claimed_at",
            "created_at",
        )
        read_only_fields = (
            "id",
            "vet",
            "access_code",
            "is_active",
            "is_used",
            "claimed_at",
            "created_at",
        )


class ClaimAccessSerializer(serializers.Serializer):
    access_code = serializers.CharField(max_length=6, min_length=6)


class _PetSummary(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    species = serializers.CharField()
    breed = serializers.CharField()


class _UserSummary(serializers.Serializer):
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.CharField()
    phone = serializers.CharField()
    crmv = serializers.CharField(required=False, allow_blank=True)
    clinic_name = serializers.CharField(required=False, allow_blank=True)


class ActiveAccessSerializer(serializers.ModelSerializer):
    """Item da lista /access/active/ — visão do tutor sobre vets com acesso ativo."""

    pet = _PetSummary(read_only=True)
    vet = _UserSummary(read_only=True)
    last_visit = serializers.SerializerMethodField()

    class Meta:
        model = VetAccessToken
        fields = ("id", "pet", "vet", "claimed_at", "expires_at", "last_visit")

    def get_last_visit(self, obj) -> str | None:
        # última nota criada pelo vet pra este pet (fallback: claimed_at)
        from health.models import HealthRecord
        last = (
            HealthRecord.objects.filter(pet=obj.pet, author=obj.vet)
            .order_by("-created_at")
            .values_list("created_at", flat=True)
            .first()
        )
        return (last or obj.claimed_at).isoformat() if (last or obj.claimed_at) else None


class HistoryAccessSerializer(serializers.ModelSerializer):
    """Item da lista /access/history/ — visão do vet sobre pets visitados."""

    pet = _PetSummary(read_only=True)
    tutor = serializers.SerializerMethodField()
    last_visit = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = VetAccessToken
        fields = (
            "id", "pet", "tutor", "claimed_at", "expires_at",
            "last_visit", "status",
        )

    def get_tutor(self, obj):
        t = obj.pet.tutor
        return {
            "id": str(t.id),
            "full_name": t.full_name,
            "email": t.email,
            "phone": t.phone,
        }

    def get_last_visit(self, obj):
        from health.models import HealthRecord
        last = (
            HealthRecord.objects.filter(pet=obj.pet, author=obj.vet)
            .order_by("-created_at")
            .values_list("created_at", flat=True)
            .first()
        )
        return (last or obj.claimed_at).isoformat() if (last or obj.claimed_at) else None

    def get_status(self, obj) -> str:
        if obj.deleted_at is not None:
            return "REVOKED"
        if obj.expires_at < timezone.now():
            return "EXPIRED"
        if obj.is_active:
            return "ACTIVE"
        return "EXPIRED"
