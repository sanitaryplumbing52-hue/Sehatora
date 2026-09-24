from django.contrib import admin

from apps.core.models import AuditLog, CustomField, CustomFieldValue, Organization, Tag


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    search_fields = ("name", "slug", "domain")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "color")
    list_filter = ("organization",)


@admin.register(CustomField)
class CustomFieldAdmin(admin.ModelAdmin):
    list_display = ("label", "entity", "field_type", "organization", "is_required")
    list_filter = ("entity", "organization")


admin.site.register(CustomFieldValue)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "organization", "user", "action", "model_name", "method", "path")
    list_filter = ("action", "organization")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
