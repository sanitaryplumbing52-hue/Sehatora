from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.models import CustomField, Tag
from apps.core.serializers import CustomFieldSerializer, TagSerializer
from apps.core.viewsets import TenantScopedViewSet


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok"})


class TagViewSet(TenantScopedViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    search_fields = ["name"]
    module = None


class CustomFieldViewSet(TenantScopedViewSet):
    queryset = CustomField.objects.all()
    serializer_class = CustomFieldSerializer
    filterset_fields = ["entity"]
    module = None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    """Instant search across contacts, companies, leads, deals, tasks."""
    from apps.companies.models import Company
    from apps.companies.serializers import CompanyListSerializer
    from apps.contacts.models import Contact
    from apps.contacts.serializers import ContactListSerializer
    from apps.deals.models import Deal
    from apps.deals.serializers import DealListSerializer
    from apps.leads.models import Lead
    from apps.leads.serializers import LeadListSerializer
    from apps.tasks.models import Task
    from apps.tasks.serializers import TaskSerializer

    from apps.core import context

    context.set_current_organization(request.user.organization)

    q = request.query_params.get("q", "").strip()
    if not q:
        return Response({"contacts": [], "companies": [], "leads": [], "deals": [], "tasks": []})

    contacts = Contact.objects.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q)
    )[:5]
    companies = Company.objects.filter(Q(name__icontains=q) | Q(website__icontains=q))[:5]
    leads = Lead.objects.filter(Q(contact__first_name__icontains=q) | Q(contact__last_name__icontains=q))[:5]
    deals = Deal.objects.filter(Q(name__icontains=q))[:5]
    tasks = Task.objects.filter(Q(name__icontains=q))[:5]

    return Response(
        {
            "contacts": ContactListSerializer(contacts, many=True).data,
            "companies": CompanyListSerializer(companies, many=True).data,
            "leads": LeadListSerializer(leads, many=True).data,
            "deals": DealListSerializer(deals, many=True).data,
            "tasks": TaskSerializer(tasks, many=True).data,
        }
    )
