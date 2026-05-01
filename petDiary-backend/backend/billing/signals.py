"""Cria Subscription FREE automaticamente quando User é criado."""
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import User
from .models import Subscription


@receiver(post_save, sender=User)
def create_free_subscription(sender, instance, created, **kwargs):
    if not created:
        return
    Subscription.objects.get_or_create(
        user=instance,
        defaults={"plan_type": Subscription.Plan.FREE, "status": Subscription.Status.ACTIVE},
    )
