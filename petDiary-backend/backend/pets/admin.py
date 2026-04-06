from django.contrib import admin

from .models import Pet


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "tutor", "species", "breed")
    list_filter = ("species",)
    search_fields = ("name",)
