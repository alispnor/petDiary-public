import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Pet(models.Model):
    class Species(models.TextChoices):
        DOG = "DOG", _("Cachorro")
        CAT = "CAT", _("Gato")
        BIRD = "BIRD", _("Pássaro")
        OTHER = "OTHER", _("Outro")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pets",
        verbose_name=_("tutor"),
        help_text=_(
            "Tutor proprietário (OWNER). Mantido para compatibilidade. "
            "A relação canônica de membros está em PetMember."
        ),
    )
    name = models.CharField(_("nome"), max_length=120)
    species = models.CharField(
        _("espécie"),
        max_length=10,
        choices=Species.choices,
        default=Species.DOG,
    )
    breed = models.CharField(_("raça"), max_length=120, blank=True, default="")
    weight_kg = models.DecimalField(
        _("peso (kg)"),
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("pet")
        verbose_name_plural = _("pets")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def is_owner(self, user) -> bool:
        return self.members.filter(user=user, role=PetMember.Role.OWNER).exists()

    def has_member(self, user) -> bool:
        return self.members.filter(user=user).exists()


class PetMember(models.Model):
    """Relaciona pets com seus 'donos' (OWNER) e 'cuidadores' (CARETAKER).

    OWNER: criou o pet ou recebeu transferência. Pode convidar/remover
    caretakers, gerar PINs, revogar acesso de vets, editar/excluir o pet.

    CARETAKER: familiar/cuidador adicionado pelo OWNER. Pode visualizar
    prontuário e adicionar registros/anexos. NÃO pode gerar PIN, NÃO pode
    revogar acesso de vets, NÃO pode remover outros caretakers.
    """

    class Role(models.TextChoices):
        OWNER = "OWNER", _("Tutor principal")
        CARETAKER = "CARETAKER", _("Familiar / cuidador")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name="members",
        verbose_name=_("pet"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pet_memberships",
        verbose_name=_("usuário"),
    )
    role = models.CharField(
        _("papel"),
        max_length=12,
        choices=Role.choices,
        default=Role.CARETAKER,
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invited_pet_memberships",
        verbose_name=_("convidado por"),
    )
    added_at = models.DateTimeField(_("adicionado em"), auto_now_add=True)

    class Meta:
        verbose_name = _("membro do pet")
        verbose_name_plural = _("membros do pet")
        unique_together = (("pet", "user"),)
        ordering = ["pet", "-added_at"]

    def __str__(self):
        return f"{self.user} ({self.get_role_display()}) → {self.pet}"
