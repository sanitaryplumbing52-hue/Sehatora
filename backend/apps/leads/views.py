from django.conf import settings
from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.core.viewsets import TenantScopedViewSet
from apps.leads.models import Lead, LeadScoreEvent
from apps.leads.serializers import LeadDetailSerializer, LeadListSerializer, LeadScoreEventSerializer


class LeadViewSet(TenantScopedViewSet):
    queryset = Lead.objects.all()
    module = "leads"
    filterset_fields = ["status", "source", "owner", "company"]
    search_fields = ["contact__first_name", "contact__last_name", "contact__email"]
    ordering_fields = ["created_at", "score", "next_follow_up_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return LeadListSerializer
        return LeadDetailSerializer

    def get_queryset(self):
        return super().get_queryset().select_related("contact", "company", "owner").prefetch_related("tags")

    @action(detail=True, methods=["post"])
    def convert_to_deal(self, request, pk=None):
        """Lead -> Deal conversion. Creates a Deal in the requested pipeline
        (defaults to the org's first/default pipeline) at its first stage,
        links it back to the lead, and marks the lead qualified."""
        from apps.deals.models import Deal, Pipeline, PipelineStage

        lead = self.get_object()
        pipeline_id = request.data.get("pipeline")
        pipeline = (
            Pipeline.objects.filter(id=pipeline_id).first()
            if pipeline_id
            else Pipeline.objects.filter(is_default=True).first() or Pipeline.objects.first()
        )
        if pipeline is None:
            raise ValidationError("No pipeline exists to convert this lead into.")
        stage = pipeline.stages.order_by("order").first()
        if stage is None:
            raise ValidationError("The selected pipeline has no stages.")

        deal = Deal.objects.create(
            organization=lead.organization,
            name=request.data.get("name") or f"{lead.contact.full_name} - {lead.company.name if lead.company else 'Deal'}",
            contact=lead.contact,
            company=lead.company,
            pipeline=pipeline,
            stage=stage,
            amount=request.data.get("amount") or 0,
            owner=lead.owner,
            expected_close_date=request.data.get("expected_close_date"),
            created_by=request.user,
            updated_by=request.user,
        )
        lead.converted_deal = deal
        lead.status = "qualified"
        lead.save(update_fields=["converted_deal", "status"])

        from apps.deals.serializers import DealDetailSerializer

        return Response(DealDetailSerializer(deal).data, status=201)

    @action(detail=True, methods=["post"], url_path="score-event")
    def score_event(self, request, pk=None):
        """Applies one of the configurable scoring rules (settings.LEAD_SCORING_RULES)
        to this lead and its contact, and records an auditable LeadScoreEvent."""
        lead = self.get_object()
        event_type = request.data.get("event_type")
        rules = settings.LEAD_SCORING_RULES
        if event_type not in rules:
            raise ValidationError({"event_type": f"Must be one of {list(rules.keys())}"})

        points = rules[event_type]
        LeadScoreEvent.objects.create(
            organization=lead.organization,
            lead=lead,
            contact=lead.contact,
            event_type=event_type,
            points=points,
            description=request.data.get("description", ""),
            created_by=request.user,
            updated_by=request.user,
        )
        lead.score = lead.score_events.aggregate(total=Sum("points"))["total"] or 0
        lead.save(update_fields=["score"])

        contact = lead.contact
        contact.lead_score = contact.score_events.aggregate(total=Sum("points"))["total"] or 0
        contact.save(update_fields=["lead_score"])

        return Response(LeadDetailSerializer(lead).data)


class LeadScoreEventViewSet(TenantScopedViewSet):
    queryset = LeadScoreEvent.objects.all()
    serializer_class = LeadScoreEventSerializer
    module = "leads"
    filterset_fields = ["lead", "contact", "event_type"]
    http_method_names = ["get", "head", "options"]
