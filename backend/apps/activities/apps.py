from django.apps import AppConfig


class ActivitiesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.activities"
    label = "activities"

    def ready(self):
        from apps.activities import signals  # noqa: F401
