from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.activities.models import Activity, Notification
from apps.activities.serializers import ActivityCreateSerializer, ActivitySerializer, NotificationSerializer
from apps.core import context
from apps.core.permissions import HasModulePermission


class ActivityViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Activity.objects.all()
    module = "activities"
    filterset_fields = ["activity_type", "content_type"]
    permission_classes = [HasModulePermission]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user and request.user.is_authenticated:
            context.set_current_organization(request.user.organization)
            context.set_current_user(request.user)

    def get_queryset(self):
        org = context.get_current_organization()
        qs = Activity.all_objects.all()
        return qs.filter(organization=org) if org else qs.none()

    def get_serializer_class(self):
        if self.action == "create":
            return ActivityCreateSerializer
        return ActivitySerializer


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    module = None

    def get_queryset(self):
        return Notification.all_objects.filter(recipient=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        return Response({"count": self.get_queryset().filter(is_read=False).count()})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})
