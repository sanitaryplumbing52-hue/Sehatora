from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.core.models import Tag
from apps.core.serializers import TagSerializer
from apps.deals.models import Deal, Pipeline, PipelineStage


class PipelineStageSerializer(serializers.ModelSerializer):
    deal_count = serializers.IntegerField(source="deals.count", read_only=True)
    stage_value = serializers.SerializerMethodField()

    class Meta:
        model = PipelineStage
        fields = ["id", "pipeline", "name", "order", "probability", "is_won", "is_lost", "deal_count", "stage_value"]

    def get_stage_value(self, obj):
        from django.db.models import Sum

        return obj.deals.aggregate(total=Sum("amount"))["total"] or 0


class PipelineSerializer(serializers.ModelSerializer):
    stages = PipelineStageSerializer(many=True, read_only=True)
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = Pipeline
        fields = ["id", "name", "is_default", "order", "stages", "total_value"]

    def get_total_value(self, obj):
        from django.db.models import Sum

        return obj.deals.aggregate(total=Sum("amount"))["total"] or 0


class DealListSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source="contact.full_name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    owner_name = serializers.CharField(source="owner.full_name", read_only=True)
    stage_name = serializers.CharField(source="stage.name", read_only=True)
    pipeline_name = serializers.CharField(source="pipeline.name", read_only=True)
    next_task = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id",
            "name",
            "pipeline",
            "pipeline_name",
            "stage",
            "stage_name",
            "contact",
            "contact_name",
            "company",
            "company_name",
            "amount",
            "currency",
            "probability",
            "owner",
            "owner_name",
            "tags",
            "expected_close_date",
            "last_activity_at",
            "next_task",
            "created_at",
        ]

    def get_next_task(self, obj):
        task = obj.tasks.exclude(status__in=["completed", "cancelled"]).order_by("due_date").first()
        if not task:
            return None
        return {"id": str(task.id), "name": task.name, "due_date": task.due_date}


class DealDetailSerializer(serializers.ModelSerializer):
    owner_detail = UserSerializer(source="owner", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", many=True, write_only=True, queryset=Tag.objects.none(), required=False
    )
    stage_name = serializers.CharField(source="stage.name", read_only=True)
    pipeline_name = serializers.CharField(source="pipeline.name", read_only=True)
    contact_name = serializers.CharField(source="contact.full_name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id",
            "name",
            "pipeline",
            "pipeline_name",
            "stage",
            "stage_name",
            "contact",
            "contact_name",
            "company",
            "company_name",
            "amount",
            "currency",
            "probability",
            "owner",
            "owner_detail",
            "tags",
            "tag_ids",
            "expected_close_date",
            "closed_at",
            "notes",
            "last_activity_at",
            "lost_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["closed_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.core.models import Tag

        self.fields["tag_ids"].child_relation.queryset = Tag.objects.all()
