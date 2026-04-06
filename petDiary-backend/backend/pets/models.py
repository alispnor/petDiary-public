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
