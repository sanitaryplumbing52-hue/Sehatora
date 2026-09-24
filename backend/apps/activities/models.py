from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models import BaseModel

ACTIVITY_TYPES = (
    ("created", "Created"),
    ("updated", "Updated"),
    ("note", "Note"),
    ("email_sent", "Email sent"),
    ("email_received", "Email received"),
    ("email_opened", "Email opened"),
    ("link_clicked", "Link clicked"),
    ("whatsapp_message", "WhatsApp message"),
    ("call", "Call"),
    ("meeting", "Meeting"),
    ("task", "Task"),
    ("deal_stage_change", "Deal stage changed"),
    ("status_change", "Status changed"),
    ("website_visit", "Website visit"),
    ("form_submission", "Form submission"),
    ("file_uploaded", "File uploaded"),
)


class Activity(BaseModel):
    """A single unified-timeline entry. Attaches to any CRM entity via a
    generic FK so Contact/Company/Lead/Deal/Ticket detail pages can all
    render the same chronological feed."""

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    related_object = GenericForeignKey("content_type", "object_id")

    activity_type = models.CharField(max_length=32, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="activities"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "content_type", "object_id", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.get_activity_type_display()}: {self.title}"


NOTIFICATION_TYPES = (
    ("new_lead", "New lead"),
    ("new_contact", "New contact"),
    ("new_deal", "New deal"),
    ("deal_won", "Deal won"),
    ("deal_lost", "Deal lost"),
    ("task_due", "Task due"),
    ("meeting_upcoming", "Upcoming meeting"),
    ("new_email", "New email"),
    ("new_whatsapp", "New WhatsApp message"),
    ("assignment", "Assignment"),
    ("automation", "Automation"),
    ("system", "System alert"),
)


class Notification(BaseModel):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=32, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    body = models.CharField(max_length=512, blank=True)
    url = models.CharField(max_length=512, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read", "-created_at"])]

    def __str__(self):
        return self.title
