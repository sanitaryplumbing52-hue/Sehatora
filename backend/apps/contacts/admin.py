from django.contrib import admin

from apps.contacts.models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "organization", "lead_status", "lifecycle_stage", "owner")
    list_filter = ("organization", "lead_status", "lifecycle_stage", "lead_source")
    search_fields = ("first_name", "last_name", "email", "phone")
