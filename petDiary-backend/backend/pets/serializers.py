from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from accounts.serializers import ADDRESS_FIELDS

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


class _MemberUserSummary(serializers.Serializer):
    """Resumo do user para retornar nas respostas de /members/."""

    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)


class PetMemberSerializer(serializers.ModelSerializer):
    """Saída do GET/POST /pets/<id>/members/."""

    user = _MemberUserSummary(read_only=True)

    class Meta:
        model = PetMember
        fields = ("id", "user", "role", "added_at")
        read_only_fields = ("id", "user", "added_at")


class InviteMemberSerializer(serializers.Serializer):
    """Body do POST /pets/<id>/members/.

    Owner cria uma CONTA NOVA para o familiar (caretaker), informando
    dados pessoais e senha temporária. O usuário criado terá
    `must_change_password=True` e fará a troca no primeiro login.
    """

    full_name = serializers.CharField(required=True, max_length=255)
    username = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True, max_length=20)
    whatsapp = serializers.BooleanField(required=False, default=False)
    document = serializers.CharField(required=False, allow_blank=True, max_length=14)
    temporary_password = serializers.CharField(required=True, write_only=True, min_length=8)

    # Endereço (opcional)
    address_zip = serializers.CharField(required=False, allow_blank=True, max_length=10)
    address_street = serializers.CharField(required=False, allow_blank=True, max_length=255)
    address_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    address_complement = serializers.CharField(required=False, allow_blank=True, max_length=120)
    address_district = serializers.CharField(required=False, allow_blank=True, max_length=120)
    address_city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    address_state = serializers.CharField(required=False, allow_blank=True, max_length=2)

    def validate_username(self, value):
        username = value.strip().lower()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso.")
        return username

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value

    @transaction.atomic
    def save(self, *, pet: Pet, owner: User) -> PetMember:
        data = self.validated_data
        password = data.pop("temporary_password")

        user = User(
            username=data["username"],
            email=data["email"],
            full_name=data["full_name"],
            role=User.Role.TUTOR,  # caretaker é tutor (TUTOR/VET enum), com role PetMember=CARETAKER
            phone=data["phone"],
            whatsapp=data.get("whatsapp", False),
            document=data.get("document", ""),
            must_change_password=True,
            **{f: data.get(f, "") for f in ADDRESS_FIELDS},
        )
        user.set_password(password)
        user.save()

        member = PetMember.objects.create(
            pet=pet,
            user=user,
            role=PetMember.Role.CARETAKER,
            added_by=owner,
        )
        return member
