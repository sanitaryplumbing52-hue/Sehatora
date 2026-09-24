from django.conf import settings
from django.db import models

from apps.companies.models import Company
from apps.core.models import BaseModel, Tag

LEAD_SOURCE_CHOICES = (
    ("website", "Website"),
    ("google", "Google"),
    ("facebook", "Facebook"),
    ("instagram", "Instagram"),
    ("linkedin", "LinkedIn"),
    ("email", "Email"),
    ("whatsapp", "WhatsApp"),
    ("referral", "Referral"),
    ("direct", "Direct"),
    ("import", "Import"),
    ("other", "Other"),
)

LEAD_STATUS_CHOICES = (
    ("new", "New"),
    ("open", "Open"),
    ("in_progress", "In Progress"),
    ("connected", "Connected"),
    ("bad_timing", "Bad Timing"),
    ("unqualified", "Unqualified"),
)

LIFECYCLE_STAGE_CHOICES = (
    ("subscriber", "Subscriber"),
    ("lead", "Lead"),
    ("mql", "Marketing Qualified Lead"),
    ("sql", "Sales Qualified Lead"),
    ("opportunity", "Opportunity"),
    ("customer", "Customer"),
    ("evangelist", "Evangelist"),
    ("other", "Other"),
)


class Contact(BaseModel):
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    whatsapp = models.CharField(max_length=32, blank=True)
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name="contacts")
    job_title = models.CharField(max_length=128, blank=True)
    website = models.URLField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    country = models.CharField(max_length=128, blank=True)
    lead_source = models.CharField(max_length=32, choices=LEAD_SOURCE_CHOICES, default="other")
    lead_status = models.CharField(max_length=32, choices=LEAD_STATUS_CHOICES, default="new")
    lifecycle_stage = models.CharField(max_length=32, choices=LIFECYCLE_STAGE_CHOICES, default="lead")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="owned_contacts"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="contacts")
    notes = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="contact_avatars/", null=True, blank=True)

    lead_score = models.IntegerField(default=0)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    next_follow_up_at = models.DateTimeField(null=True, blank=True)

    # marketing attribution captured at first conversion
    utm_source = models.CharField(max_length=128, blank=True)
    utm_medium = models.CharField(max_length=128, blank=True)
    utm_campaign = models.CharField(max_length=128, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "email"]),
            models.Index(fields=["organization", "last_name", "first_name"]),
        ]

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
