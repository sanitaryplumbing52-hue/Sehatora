from rest_framework import serializers

from apps.activities.models import Activity, Notification


class ActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)
    entity_type = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "activity_type",
            "title",
            "description",
            "metadata",
            "actor",
            "actor_name",
            "entity_type",
            "object_id",
            "created_at",
        ]


class ActivityCreateSerializer(serializers.ModelSerializer):
    entity_type = serializers.ChoiceField(choices=["contact", "company", "lead", "deal", "ticket"])
    entity_id = serializers.UUIDField()

    class Meta:
        model = Activity
        fields = ["id", "activity_type", "title", "description", "metadata", "entity_type", "entity_id"]

    def create(self, validated_data):
        from django.contrib.contenttypes.models import ContentType

        entity_type = validated_data.pop("entity_type")
        entity_id = validated_data.pop("entity_id")
        model_map = {
            "contact": "contacts.Contact",
            "company": "companies.Company",
            "lead": "leads.Lead",
            "deal": "deals.Deal",
            "ticket": "tickets.Ticket",
        }
        app_label, model_name = model_map[entity_type].split(".")
        content_type = ContentType.objects.get(app_label=app_label, model=model_name.lower())
        request = self.context["request"]
        return Activity.objects.create(
            organization=request.user.organization,
            content_type=content_type,
            object_id=entity_id,
            actor=request.user,
            created_by=request.user,
            updated_by=request.user,
            **validated_data,
        )


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "body", "url", "is_read", "created_at"]
