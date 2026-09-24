import uuid

from django.conf import settings
from django.db import models


class Organization(models.Model):
    """A tenant. Every business using the CRM gets exactly one of these,
    and every tenant-scoped record below carries a FK to it so tenants
    can never see each other's data (enforced in apps.core.managers)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    domain = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to="org_logos/", null=True, blank=True)
    timezone = models.CharField(max_length=64, default="Asia/Dubai")
    currency = models.CharField(max_length=8, default="AED")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TenantManager(models.Manager):
    """Scopes queries to the current tenant set by CurrentOrganizationMiddleware.

    Explicit filtering (rather than a separate DB per tenant) keeps the
    single-server deployment story simple while still guaranteeing no
    cross-tenant leakage as long as views use `.objects` (the default)
    instead of a raw QuerySet.
    """

    def get_queryset(self):
        from apps.core.context import get_current_organization

        qs = super().get_queryset()
        org = get_current_organization()
        if org is not None:
            qs = qs.filter(organization=org)
        return qs


class TenantModel(models.Model):
    """Abstract base for every tenant-owned record."""

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="+")

    objects = TenantManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True


class BaseModel(TenantModel):
    """Abstract base adding UUID pk, audit timestamps/users, and soft delete."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True


class Tag(BaseModel):
    name = models.CharField(max_length=64)
    color = models.CharField(max_length=16, default="#2563EB")

    class Meta:
        unique_together = ("organization", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


CUSTOM_FIELD_ENTITIES = (
    ("contact", "Contact"),
    ("company", "Company"),
    ("lead", "Lead"),
    ("deal", "Deal"),
    ("ticket", "Ticket"),
)

CUSTOM_FIELD_TYPES = (
    ("text", "Text"),
    ("long_text", "Long text"),
    ("number", "Number"),
    ("email", "Email"),
    ("phone", "Phone"),
    ("date", "Date"),
    ("dropdown", "Dropdown"),
    ("multiselect", "Multi-select"),
    ("checkbox", "Checkbox"),
    ("currency", "Currency"),
    ("url", "URL"),
)


class CustomField(BaseModel):
    """Admin-defined field extending one of the core entities."""

    entity = models.CharField(max_length=32, choices=CUSTOM_FIELD_ENTITIES)
    label = models.CharField(max_length=128)
    key = models.SlugField(max_length=128)
    field_type = models.CharField(max_length=32, choices=CUSTOM_FIELD_TYPES)
    options = models.JSONField(default=list, blank=True)  # for dropdown/multiselect
    is_required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("organization", "entity", "key")
        ordering = ["entity", "order"]

    def __str__(self):
        return f"{self.entity}.{self.key}"


class CustomFieldValue(BaseModel):
    field = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="values")
    entity_id = models.UUIDField()
    value = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = ("field", "entity_id")

    def __str__(self):
        return f"{self.field.key}={self.value}"


AUDIT_ACTIONS = (
    ("create", "Create"),
    ("update", "Update"),
    ("delete", "Delete"),
    ("login", "Login"),
    ("login_failed", "Login failed"),
    ("logout", "Logout"),
    ("export", "Export"),
    ("import", "Import"),
)


class AuditLog(models.Model):
    """Immutable record of who did what, for the settings > audit log screen
    and for security/compliance review."""

    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(Organization, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    action = models.CharField(max_length=32, choices=AUDIT_ACTIONS)
    model_name = models.CharField(max_length=128, blank=True)
    object_id = models.CharField(max_length=64, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    path = models.CharField(max_length=512, blank=True)
    method = models.CharField(max_length=8, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.action} {self.model_name} by {self.user_id} @ {self.created_at}"
