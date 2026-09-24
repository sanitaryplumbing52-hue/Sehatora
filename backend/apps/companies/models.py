from django.conf import settings
from django.db import models

from apps.core.models import BaseModel, Tag

COMPANY_SIZE_CHOICES = (
    ("1-10", "1-10"),
    ("11-50", "11-50"),
    ("51-200", "51-200"),
    ("201-500", "201-500"),
    ("501-1000", "501-1000"),
    ("1000+", "1000+"),
)


class Company(BaseModel):
    name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=128, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    country = models.CharField(max_length=128, blank=True)
    employees = models.CharField(max_length=16, choices=COMPANY_SIZE_CHOICES, blank=True)
    annual_revenue = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="owned_companies"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="companies")
    notes = models.TextField(blank=True)
    logo = models.ImageField(upload_to="company_logos/", null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["organization", "name"])]

    def __str__(self):
        return self.name
