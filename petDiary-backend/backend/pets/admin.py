from django.contrib import admin

from .models import Pet, PetMember


class PetMemberInline(admin.TabularInline):
    model = PetMember
    extra = 0
    autocomplete_fields = ("user", "added_by")
    fields = ("user", "role", "added_by", "added_at")
    readonly_fields = ("added_at",)


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "tutor", "species", "breed")
    list_filter = ("species",)
    search_fields = ("name", "tutor__username", "tutor__full_name")
    inlines = [PetMemberInline]


@admin.register(PetMember)
class PetMemberAdmin(admin.ModelAdmin):
    list_display = ("pet", "user", "role", "added_by", "added_at")
    list_filter = ("role",)
    search_fields = ("pet__name", "user__username", "user__full_name")
    autocomplete_fields = ("pet", "user", "added_by")
