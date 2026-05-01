"""Data migration: cria PetMember(role=OWNER) para cada Pet existente."""
from django.db import migrations


def create_owner_memberships(apps, schema_editor):
    Pet = apps.get_model("pets", "Pet")
    PetMember = apps.get_model("pets", "PetMember")

    for pet in Pet.objects.all().iterator():
        if not pet.tutor_id:
            continue
        PetMember.objects.get_or_create(
            pet=pet,
            user_id=pet.tutor_id,
            defaults={
                "role": "OWNER",
                "added_by_id": pet.tutor_id,
            },
        )


def reverse_remove_owners(apps, schema_editor):
    PetMember = apps.get_model("pets", "PetMember")
    PetMember.objects.filter(role="OWNER").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("pets", "0002_alter_pet_tutor_petmember"),
    ]

    operations = [
        migrations.RunPython(create_owner_memberships, reverse_remove_owners),
    ]
