from rest_framework import serializers

from apps.tasks.models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)
    contact_name = serializers.CharField(source="contact.full_name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    deal_name = serializers.CharField(source="deal.name", read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "name",
            "task_type",
            "assigned_to",
            "assigned_to_name",
            "contact",
            "contact_name",
            "company",
            "company_name",
            "deal",
            "deal_name",
            "due_date",
            "priority",
            "status",
            "notes",
            "completed_at",
            "is_overdue",
            "created_at",
        ]
        read_only_fields = ["completed_at", "created_at"]

    def get_is_overdue(self, obj):
        from django.utils import timezone

        return bool(obj.due_date and obj.due_date < timezone.now() and obj.status not in ("completed", "cancelled"))
