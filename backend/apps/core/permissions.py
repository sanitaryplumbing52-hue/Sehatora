from rest_framework.permissions import BasePermission

ACTION_TO_PERMISSION = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "edit",
    "partial_update": "edit",
    "destroy": "delete",
}


class HasModulePermission(BasePermission):
    """Checks the acting user's Role.permissions map for the viewset's
    declared `module` (e.g. "contacts") and the DRF action being performed,
    mapped to one of view/create/edit/delete via ACTION_TO_PERMISSION.

    Custom @action methods should set `required_permission` on themselves,
    otherwise they default to requiring "edit" on the module.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        module = getattr(view, "module", None)
        if module is None:
            return True  # views that don't opt in are left to IsAuthenticated only

        role = getattr(request.user, "role", None)
        if role is None:
            return False

        action = getattr(view, "action", None)
        handler = getattr(view, action, None) if action else None
        required = getattr(handler, "required_permission", None) or ACTION_TO_PERMISSION.get(action, "view")

        return role.has_permission(module, required)


def require_permission(permission):
    """Decorator for @action methods to declare which permission bucket
    (view/create/edit/delete/export) they require."""

    def decorator(func):
        func.required_permission = permission
        return func

    return decorator
