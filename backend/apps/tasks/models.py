from django.conf import settings
from django.db import models

from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.core.models import BaseModel
from apps.deals.models import Deal

PRIORITY_CHOICES = (
    ("low", "Low"),
    ("medium", "Medium"),
    ("high", "High"),
)

STATUS_CHOICES = (
    ("pending", "Pending"),
    ("in_progress", "In Progress"),
    ("completed", "Completed"),
    ("cancelled", "Cancelled"),
)

TASK_TYPE_CHOICES = (
    ("task", "Task"),
    ("call", "Call"),
    ("email", "Email"),
    ("meeting", "Meeting"),
)


class Task(BaseModel):
    name = models.CharField(max_length=255)
    task_type = models.CharField(max_length=16, choices=TASK_TYPE_CHOICES, default="task")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks"
    )
    contact = models.ForeignKey(Contact, null=True, blank=True, on_delete=models.CASCADE, related_name="tasks")
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.CASCADE, related_name="tasks")
    deal = models.ForeignKey(Deal, null=True, blank=True, on_delete=models.CASCADE, related_name="tasks")
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["due_date", "-created_at"]
        indexes = [
            models.Index(fields=["organization", "assigned_to", "status"]),
            models.Index(fields=["organization", "due_date"]),
        ]

    def __str__(self):
        return self.name
