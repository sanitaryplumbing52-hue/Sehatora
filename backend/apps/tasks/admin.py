from django.contrib import admin

from apps.tasks.models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "assigned_to", "status", "priority", "due_date")
    list_filter = ("organization", "status", "priority")
    search_fields = ("name",)
