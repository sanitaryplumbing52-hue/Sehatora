from rest_framework import viewsets

from apps.core import context
from apps.core.permissions import HasModulePermission


class TenantScopedViewSet(viewsets.ModelViewSet):
    """Base viewset for every tenant-owned resource.

    - Sets the thread-local "current organization" as soon as DRF has
      authenticated the request, so model managers (TenantManager) scope
      every query to it automatically.
    - Stamps organization/created_by/updated_by on writes.
    - Requires `module` to be set for HasModulePermission to apply RBAC;
      subclasses that don't set it fall back to IsAuthenticated only.
    """

    permission_classes = [HasModulePermission]
    module = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user and request.user.is_authenticated:
            context.set_current_organization(request.user.organization)
            context.set_current_user(request.user)

    def get_queryset(self):
        # apps.core.models.TenantManager already filters by the thread-local
        # organization; .all() here is intentionally the tenant-scoped default.
        return self.queryset.model.objects.all()

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
