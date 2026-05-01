from rest_framework import serializers

from .models import Pet, PetMember


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
        """Quando tutor cria pet, ele vira automaticamente OWNER via PetMember.

        Mantém `pet.tutor` preenchido (compatibilidade), mas a fonte da
        verdade de quem pode acessar é a tabela PetMember.
        """
        user = self.context["request"].user
        validated_data["tutor"] = user
        pet = super().create(validated_data)
        PetMember.objects.create(
            pet=pet, user=user, role=PetMember.Role.OWNER, added_by=user,
        )
        return pet
