from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "full_name", "role", "email", "phone", "is_active")
    list_filter = ("role", "is_active", "whatsapp")
    search_fields = ("username", "full_name", "email", "phone", "document", "crmv")
    fieldsets = BaseUserAdmin.fieldsets + (
        (_("PetDiary — Identidade"), {
            "fields": ("iam_uid", "role", "full_name", "document"),
        }),
        (_("PetDiary — Contato"), {
            "fields": ("phone", "whatsapp"),
        }),
        (_("PetDiary — Veterinário"), {
            "fields": ("crmv", "clinic_name"),
            "classes": ("collapse",),
        }),
        (_("PetDiary — Endereço"), {
            "fields": (
                "address_zip", "address_street", "address_number",
                "address_complement", "address_district",
                "address_city", "address_state",
            ),
            "classes": ("collapse",),
        }),
    )
