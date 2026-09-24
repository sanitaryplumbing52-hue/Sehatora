import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import Organization

MODULES = (
    "contacts",
    "companies",
    "leads",
    "deals",
    "tasks",
    "activities",
    "reports",
    "settings",
    "team",
)
PERMISSION_ACTIONS = ("view", "create", "edit", "delete", "export")

#: Built-in role presets used when a new Organization is provisioned.
#: Super Admin/Admin get everything; the rest are HubSpot-style personas
#: with sensible restricted defaults an org admin can still edit later.
DEFAULT_ROLE_PRESETS = {
    "Super Admin": {m: list(PERMISSION_ACTIONS) for m in MODULES},
    "Admin": {m: list(PERMISSION_ACTIONS) for m in MODULES},
    "Manager": {
        **{m: ["view", "create", "edit", "export"] for m in MODULES},
        "team": ["view"],
        "settings": ["view"],
    },
    "Sales": {
        "contacts": ["view", "create", "edit"],
        "companies": ["view", "create", "edit"],
        "leads": ["view", "create", "edit"],
        "deals": ["view", "create", "edit"],
        "tasks": ["view", "create", "edit"],
        "activities": ["view", "create", "edit"],
        "reports": ["view"],
        "settings": [],
        "team": [],
    },
    "Marketing": {
        "contacts": ["view", "create", "edit", "export"],
        "companies": ["view"],
        "leads": ["view", "create", "edit", "export"],
        "deals": ["view"],
        "tasks": ["view", "create", "edit"],
        "activities": ["view", "create"],
        "reports": ["view", "export"],
        "settings": [],
        "team": [],
    },
    "Support": {
        "contacts": ["view", "edit"],
        "companies": ["view"],
        "leads": ["view"],
        "deals": ["view"],
        "tasks": ["view", "create", "edit"],
        "activities": ["view", "create"],
        "reports": ["view"],
        "settings": [],
        "team": [],
    },
    "Viewer": {m: ["view"] for m in MODULES},
}


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="roles")
    name = models.CharField(max_length=64)
    is_system = models.BooleanField(default=False)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

    def has_permission(self, module: str, action: str) -> bool:
        return action in self.permissions.get(module, [])


class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=255, blank=True)
    manager = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="managed_teams"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="users", null=True, blank=True
    )
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="members")
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    job_title = models.CharField(max_length=128, blank=True)
    is_org_owner = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def full_name(self):
        return self.get_full_name() or self.username


class LoginHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_history")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    success = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
