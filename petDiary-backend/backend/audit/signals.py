"""Receivers que criam AuditLog automaticamente para eventos críticos.

Cuidados especiais com cascade delete:
- Quando um Pet é excluído, Django excluí em cascade os HealthRecords,
  PetMembers e VetAccessTokens. Não queremos logar cada um (pollui o log
  e quebra FK constraint do audit_log.pet).
- Usamos thread-local _suppress_pet_id que é setado no post_delete de Pet
  e os outros signals checam essa flag.
"""
import threading

from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver

from health.models import HealthRecord
from pets.models import Pet, PetMember
from access.models import VetAccessToken

from .helpers import log_action


_thread_locals = threading.local()


def set_current_user(user):
    _thread_locals.user = user


def get_current_user():
    return getattr(_thread_locals, "user", None)


def _is_cascade_delete(pet_id) -> bool:
    """True se estamos dentro de cascade delete do Pet com este id."""
    suppressing = getattr(_thread_locals, "suppress_pet_ids", set())
    return pet_id in suppressing


@receiver(pre_delete, sender=Pet)
def on_pet_pre_delete(sender, instance, **kwargs):
    """Marca cascade ANTES dos cascade deletes começarem."""
    s = getattr(_thread_locals, "suppress_pet_ids", None)
    if s is None:
        s = set()
        _thread_locals.suppress_pet_ids = s
    s.add(instance.id)


@receiver(post_delete, sender=Pet)
def on_pet_delete(sender, instance, **kwargs):
    """Loga a exclusão do pet em si e remove a flag de suppress."""
    log_action(
        actor=get_current_user(),
        action="DELETE",
        entity_type="Pet",
        entity_id=instance.id,
        pet=None,  # pet já não existe — não queremos FK aqui
        description=f"Excluiu pet: {instance.name}",
    )
    s = getattr(_thread_locals, "suppress_pet_ids", set())
    s.discard(instance.id)


@receiver(post_save, sender=HealthRecord)
def on_health_record_save(sender, instance, created, **kwargs):
    user = get_current_user() or instance.author
    log_action(
        actor=user,
        action="CREATE" if created else "UPDATE",
        entity=instance,
        pet=instance.pet,
        description=f"{instance.get_record_type_display()}: {instance.title}",
    )


@receiver(post_delete, sender=HealthRecord)
def on_health_record_delete(sender, instance, **kwargs):
    if _is_cascade_delete(instance.pet_id):
        return  # cascade: não logar item-a-item
    log_action(
        actor=get_current_user(),
        action="DELETE",
        entity_type="HealthRecord",
        entity_id=instance.id,
        pet=instance.pet,
        description=f"Removeu registro: {instance.title}",
    )


@receiver(post_save, sender=Pet)
def on_pet_save(sender, instance, created, **kwargs):
    verbo = "Cadastrou" if created else "Atualizou"
    log_action(
        actor=get_current_user() or instance.tutor,
        action="CREATE" if created else "UPDATE",
        entity=instance,
        pet=instance,
        description=f"{verbo} pet: {instance.name}",
    )


@receiver(post_save, sender=PetMember)
def on_member_save(sender, instance, created, **kwargs):
    if not created:
        return
    log_action(
        actor=instance.added_by or get_current_user(),
        action="CREATE",
        entity=instance,
        pet=instance.pet,
        description=f"Adicionou {instance.user.full_name} como {instance.get_role_display()}",
    )


@receiver(post_delete, sender=PetMember)
def on_member_delete(sender, instance, **kwargs):
    if _is_cascade_delete(instance.pet_id):
        return
    log_action(
        actor=get_current_user(),
        action="DELETE",
        entity_type="PetMember",
        entity_id=instance.id,
        pet=instance.pet,
        description=f"Removeu {instance.user.full_name} do pet",
    )


@receiver(post_save, sender=VetAccessToken)
def on_token_save(sender, instance, created, update_fields=None, **kwargs):
    user = get_current_user()
    if instance.deleted_at is not None:
        log_action(
            actor=user,
            action="REVOKE",
            entity=instance,
            pet=instance.pet,
            description=f"Revogou acesso do vet ao pet {instance.pet.name}",
        )
    elif instance.is_used and instance.claimed_at and not created:
        if update_fields and "is_used" in (update_fields or []):
            log_action(
                actor=instance.vet,
                action="CLAIM",
                entity=instance,
                pet=instance.pet,
                description="Vet acessou prontuário via PIN",
            )
