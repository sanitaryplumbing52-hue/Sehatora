from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantScopedViewSet
from apps.tasks.models import STATUS_CHOICES, Task
from apps.tasks.serializers import TaskSerializer


class TaskViewSet(TenantScopedViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    module = "tasks"
    filterset_fields = ["status", "priority", "task_type", "assigned_to", "contact", "company", "deal"]
    search_fields = ["name", "notes"]
    ordering_fields = ["due_date", "priority", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset().select_related("assigned_to", "contact", "company", "deal")
        due_after = self.request.query_params.get("due_after")
        due_before = self.request.query_params.get("due_before")
        if due_after:
            qs = qs.filter(due_date__gte=due_after)
        if due_before:
            qs = qs.filter(due_date__lte=due_before)
        return qs

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = self.filter_queryset(self.get_queryset().filter(assigned_to=request.user))
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page or qs, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=False, methods=["get"])
    def kanban(self, request):
        qs = self.filter_queryset(self.get_queryset())
        columns = []
        for value, label in STATUS_CHOICES:
            tasks = qs.filter(status=value)
            columns.append({"status": value, "label": label, "tasks": TaskSerializer(tasks, many=True).data})
        return Response(columns)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = "completed"
        task.completed_at = timezone.now()
        task.save(update_fields=["status", "completed_at"])

        for entity in (task.contact, task.company, task.deal):
            if entity is not None:
                from apps.activities.utils import log_activity

                log_activity(entity, "task", f"Task completed: {task.name}", actor=request.user)

        return Response(TaskSerializer(task).data)
