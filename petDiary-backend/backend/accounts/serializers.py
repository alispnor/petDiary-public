from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import User


# Lista de campos de endereço — usada nos dois serializers
ADDRESS_FIELDS = (
    "address_zip",
    "address_street",
    "address_number",
    "address_complement",
    "address_district",
    "address_city",
    "address_state",
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer de leitura/edição do usuário autenticado (/users/me/)."""

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "phone",
            "whatsapp",
            "document",
            "crmv",
            "clinic_name",
            "must_change_password",
            *ADDRESS_FIELDS,
        )
        # role e must_change_password mutáveis apenas via endpoints dedicados
        read_only_fields = ("id", "role", "must_change_password")


class ChangePasswordSerializer(serializers.Serializer):
    """Body do POST /auth/change-password/.

    Se o usuário tem `must_change_password=True` (caretaker recém-convidado),
    `current_password` é OPCIONAL — primeira troca dispensa a senha temporária
    informada pelo OWNER. Para os demais casos, é obrigatório.
    """

    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer de cadastro (POST /auth/register/).

    Regras:
    - email e phone são obrigatórios
    - se role=VET → crmv e clinic_name obrigatórios
    - se role=TUTOR → ignora crmv/clinic_name (mesmo se vier preenchido)
    - document (CPF) é opcional para todos
    - endereço é opcional na fase 1
    """

    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True, allow_blank=False)
    phone = serializers.CharField(required=True, allow_blank=False, max_length=20)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "full_name",
            "role",
            "phone",
            "whatsapp",
            "document",
            "crmv",
            "clinic_name",
            *ADDRESS_FIELDS,
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        role = attrs.get("role", User.Role.TUTOR)
        errors = {}

        if role == User.Role.VET:
            if not (attrs.get("crmv") or "").strip():
                errors["crmv"] = _("CRMV é obrigatório para veterinários.")
            if not (attrs.get("clinic_name") or "").strip():
                errors["clinic_name"] = _("Nome da clínica é obrigatório para veterinários.")
        else:
            # tutor não tem clínica/crmv — força vazio
            attrs["crmv"] = ""
            attrs["clinic_name"] = ""

        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
