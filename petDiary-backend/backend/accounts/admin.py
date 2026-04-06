from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "full_name", "role", "email", "is_active")
    list_filter = ("role", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (
        (_("PetDiary"), {"fields": ("iam_uid", "role", "full_name", "crmv")}),
    )
