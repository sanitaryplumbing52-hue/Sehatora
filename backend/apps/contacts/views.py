from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.contacts.models import Contact
from apps.contacts.serializers import ContactDetailSerializer, ContactListSerializer
from apps.core.viewsets import TenantScopedViewSet


class ContactViewSet(TenantScopedViewSet):
    queryset = Contact.objects.all()
    module = "contacts"
    filterset_fields = ["lead_source", "lead_status", "lifecycle_stage", "owner", "company", "country"]
    search_fields = ["first_name", "last_name", "email", "phone", "whatsapp"]
    ordering_fields = ["created_at", "last_activity_at", "lead_score", "next_follow_up_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ContactListSerializer
        return ContactDetailSerializer

    def get_queryset(self):
        return super().get_queryset().select_related("company", "owner").prefetch_related("tags")

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        from apps.activities.serializers import ActivitySerializer
        from apps.activities.utils import get_timeline_for

        contact = self.get_object()
        return Response(ActivitySerializer(get_timeline_for(contact), many=True).data)

    @action(detail=True, methods=["get"])
    def deals(self, request, pk=None):
        from apps.deals.serializers import DealListSerializer

        contact = self.get_object()
        return Response(DealListSerializer(contact.deals.all(), many=True).data)

    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        from apps.tasks.serializers import TaskSerializer

        contact = self.get_object()
        return Response(TaskSerializer(contact.tasks.all(), many=True).data)

    @action(detail=True, methods=["post"])
    def log_contact(self, request, pk=None):
        """Marks the contact as contacted now (used by call/email/WhatsApp
        logging flows to keep 'Last Contacted' accurate)."""
        contact = self.get_object()
        now = timezone.now()
        contact.last_contacted_at = now
        contact.last_activity_at = now
        contact.save(update_fields=["last_contacted_at", "last_activity_at"])
        return Response(ContactDetailSerializer(contact).data)
