from django.conf import settings
from django.db import models

from apps.companies.models import Company
from apps.contacts.models import LEAD_SOURCE_CHOICES, Contact
from apps.core.models import BaseModel, Tag

LEAD_STATUS_CHOICES = (
    ("new", "New"),
    ("contacted", "Contacted"),
    ("qualified", "Qualified"),
    ("proposal", "Proposal"),
    ("negotiation", "Negotiation"),
    ("won", "Won"),
    ("lost", "Lost"),
    ("nurturing", "Nurturing"),
)

SCORE_EVENT_CHOICES = (
    ("website_visit", "Website visit"),
    ("form_submission", "Form submission"),
    ("email_opened", "Email opened"),
    ("email_clicked", "Email clicked"),
    ("whatsapp_reply", "WhatsApp reply"),
    ("meeting_booked", "Meeting booked"),
)


class Lead(BaseModel):
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="leads")
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name="leads")
    source = models.CharField(max_length=32, choices=LEAD_SOURCE_CHOICES, default="other")
    status = models.CharField(max_length=32, choices=LEAD_STATUS_CHOICES, default="new")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="owned_leads"
    )
    score = models.IntegerField(default=0)
    tags = models.ManyToManyField(Tag, blank=True, related_name="leads")
    notes = models.TextField(blank=True)
    utm_campaign = models.CharField(max_length=128, blank=True)
    landing_page = models.URLField(blank=True)
    next_follow_up_at = models.DateTimeField(null=True, blank=True)
    converted_deal = models.ForeignKey(
        "deals.Deal", null=True, blank=True, on_delete=models.SET_NULL, related_name="source_lead"
    )
    lost_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self):
        return f"{self.contact.full_name} ({self.get_status_display()})"


class LeadScoreEvent(BaseModel):
    """One entry per scoring rule firing (see settings.LEAD_SCORING_RULES),
    so a lead/contact's score is always reconstructable and auditable
    rather than just a mutable integer."""

    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.CASCADE, related_name="score_events")
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="score_events")
    event_type = models.CharField(max_length=32, choices=SCORE_EVENT_CHOICES)
    points = models.IntegerField()
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
