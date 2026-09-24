from django.conf import settings
from django.db import models

from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.core.models import BaseModel, Tag


class Pipeline(BaseModel):
    """A named deal pipeline. Orgs can create unlimited pipelines
    (Sales Pipeline, Service Pipeline, Real Estate Pipeline, ...)."""

    name = models.CharField(max_length=128)
    is_default = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        unique_together = ("organization", "name")

    def __str__(self):
        return self.name


class PipelineStage(BaseModel):
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name="stages")
    name = models.CharField(max_length=128)
    order = models.PositiveIntegerField(default=0)
    probability = models.PositiveSmallIntegerField(default=10, help_text="Default win probability % for deals entering this stage")
    is_won = models.BooleanField(default=False)
    is_lost = models.BooleanField(default=False)

    class Meta:
        ordering = ["pipeline", "order"]
        unique_together = ("pipeline", "name")

    def __str__(self):
        return f"{self.pipeline.name} / {self.name}"


class Deal(BaseModel):
    name = models.CharField(max_length=255)
    pipeline = models.ForeignKey(Pipeline, on_delete=models.PROTECT, related_name="deals")
    stage = models.ForeignKey(PipelineStage, on_delete=models.PROTECT, related_name="deals")
    contact = models.ForeignKey(Contact, null=True, blank=True, on_delete=models.SET_NULL, related_name="deals")
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name="deals")
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default="AED")
    probability = models.PositiveSmallIntegerField(default=10)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="owned_deals"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="deals")
    expected_close_date = models.DateField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    lost_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "pipeline", "stage"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.stage_id and not self.probability:
            self.probability = self.stage.probability
        super().save(*args, **kwargs)
