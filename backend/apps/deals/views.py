from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core.viewsets import TenantScopedViewSet
from apps.deals.models import Deal, Pipeline, PipelineStage
from apps.deals.serializers import (
    DealDetailSerializer,
    DealListSerializer,
    PipelineSerializer,
    PipelineStageSerializer,
)


class PipelineViewSet(TenantScopedViewSet):
    queryset = Pipeline.objects.all()
    serializer_class = PipelineSerializer
    module = "deals"

    def get_queryset(self):
        return super().get_queryset().prefetch_related("stages")


class PipelineStageViewSet(TenantScopedViewSet):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer
    module = "deals"
    filterset_fields = ["pipeline"]


class DealViewSet(TenantScopedViewSet):
    queryset = Deal.objects.all()
    module = "deals"
    filterset_fields = ["pipeline", "stage", "owner", "contact", "company"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "amount", "expected_close_date", "last_activity_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return DealListSerializer
        return DealDetailSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related("pipeline", "stage", "contact", "company", "owner")
            .prefetch_related("tags")
        )

    @action(detail=False, methods=["get"], url_path="kanban")
    def kanban(self, request):
        """Board view for a pipeline: stages with their deals, ready to
        render as drag-and-drop columns."""
        pipeline_id = request.query_params.get("pipeline")
        pipeline = (
            Pipeline.objects.filter(id=pipeline_id).first()
            if pipeline_id
            else Pipeline.objects.filter(is_default=True).first() or Pipeline.objects.first()
        )
        if pipeline is None:
            return Response({"pipeline": None, "stages": []})

        stages = pipeline.stages.order_by("order").prefetch_related("deals")
        data = []
        for stage in stages:
            deals = stage.deals.select_related("contact", "company", "owner").prefetch_related("tags")
            data.append(
                {
                    "id": str(stage.id),
                    "name": stage.name,
                    "order": stage.order,
                    "is_won": stage.is_won,
                    "is_lost": stage.is_lost,
                    "total_value": sum(d.amount for d in deals),
                    "deals": DealListSerializer(deals, many=True).data,
                }
            )
        return Response({"pipeline": PipelineSerializer(pipeline).data, "stages": data})

    @action(detail=True, methods=["post"], url_path="move-stage")
    def move_stage(self, request, pk=None):
        """Drag-and-drop endpoint: moves a deal to a new stage (possibly in
        a different pipeline) and keeps amount/probability/closed_at consistent."""
        deal = self.get_object()
        stage_id = request.data.get("stage")
        if not stage_id:
            raise ValidationError({"stage": "This field is required."})
        stage = PipelineStage.objects.filter(id=stage_id).first()
        if stage is None:
            raise ValidationError({"stage": "Stage not found."})

        deal.stage = stage
        deal.pipeline = stage.pipeline
        deal.probability = stage.probability
        deal.last_activity_at = timezone.now()
        if stage.is_won or stage.is_lost:
            deal.closed_at = timezone.now()
            if stage.is_lost and not deal.lost_reason:
                deal.lost_reason = request.data.get("lost_reason", "")
        else:
            deal.closed_at = None
        deal.updated_by = request.user
        deal.save()

        return Response(DealDetailSerializer(deal).data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        from apps.activities.serializers import ActivitySerializer
        from apps.activities.utils import get_timeline_for

        deal = self.get_object()
        return Response(ActivitySerializer(get_timeline_for(deal), many=True).data)
