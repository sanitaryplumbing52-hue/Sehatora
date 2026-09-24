from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.companies.models import Company
from apps.companies.serializers import CompanyDetailSerializer, CompanyListSerializer
from apps.core.viewsets import TenantScopedViewSet


class CompanyViewSet(TenantScopedViewSet):
    queryset = Company.objects.all()
    module = "companies"
    filterset_fields = ["industry", "country", "owner", "employees"]
    search_fields = ["name", "website", "email", "phone"]
    ordering_fields = ["name", "created_at", "annual_revenue", "last_activity_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return CompanyListSerializer
        return CompanyDetailSerializer

    def get_queryset(self):
        return super().get_queryset().select_related("owner").prefetch_related("tags", "contacts", "deals")

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        from apps.activities.serializers import ActivitySerializer
        from apps.activities.utils import get_timeline_for

        company = self.get_object()
        return Response(ActivitySerializer(get_timeline_for(company), many=True).data)

    @action(detail=True, methods=["post"])
    def touch(self, request, pk=None):
        company = self.get_object()
        company.last_activity_at = timezone.now()
        company.save(update_fields=["last_activity_at"])
        return Response(CompanyDetailSerializer(company).data)
