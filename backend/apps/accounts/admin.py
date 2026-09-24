from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.accounts.models import LoginHistory, Role, Team, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "organization", "role", "team", "is_active", "is_org_owner")
    list_filter = ("organization", "role", "team", "is_active")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("CRM", {"fields": ("organization", "role", "team", "phone", "avatar", "job_title", "is_org_owner")}),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "is_system")
    list_filter = ("organization",)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "manager")
    list_filter = ("organization",)


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "success", "ip_address", "created_at")
    list_filter = ("success",)
    readonly_fields = [f.name for f in LoginHistory._meta.fields]

    def has_add_permission(self, request):
        return False
