from django.contrib import admin

from apps.activities.models import Activity, Notification


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "activity_type", "organization", "actor", "created_at")
    list_filter = ("activity_type", "organization")
    readonly_fields = [f.name for f in Activity._meta.fields]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
