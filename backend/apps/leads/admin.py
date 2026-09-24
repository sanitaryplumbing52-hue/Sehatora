from django.contrib import admin

from apps.leads.models import Lead, LeadScoreEvent


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("contact", "status", "source", "score", "owner", "organization")
    list_filter = ("organization", "status", "source")


@admin.register(LeadScoreEvent)
class LeadScoreEventAdmin(admin.ModelAdmin):
    list_display = ("contact", "event_type", "points", "created_at")
    list_filter = ("event_type",)
