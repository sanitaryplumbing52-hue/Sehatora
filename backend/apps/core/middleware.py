from apps.core import context


class CurrentOrganizationMiddleware:
    """Resets the request-scoped tenant context on every request.

    The actual organization is set later, once DRF has authenticated the
    request (see apps.core.viewsets.TenantScopedViewSet.initial), because
    JWT authentication only happens inside the view, after middleware has
    already run. This middleware's job is purely to guarantee the
    thread-local is clean at the start and end of each request so nothing
    leaks between requests on a threaded/sync worker.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        context.clear()
        if getattr(request, "user", None) is not None and request.user.is_authenticated:
            org = getattr(request.user, "organization", None)
            if org is not None:
                context.set_current_organization(org)
            context.set_current_user(request.user)
        try:
            response = self.get_response(request)
        finally:
            pass
        context.clear()
        return response


class AuditLogMiddleware:
    """Records a lightweight audit trail entry for state-changing requests.

    Read-only GET/HEAD/OPTIONS requests are skipped to keep the audit_logs
    table from growing unbounded; those are covered by access/login logs
    instead.
    """

    SKIP_PATHS = ("/api/schema", "/api/docs", "/health")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            self._log(request, response)
        except Exception:  # never break the response because logging failed
            pass
        return response

    def _log(self, request, response):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return
        if any(request.path.startswith(p) for p in self.SKIP_PATHS):
            return
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return
        if response.status_code >= 500:
            return

        from apps.core.models import AuditLog

        AuditLog.objects.create(
            organization=getattr(user, "organization", None),
            user=user,
            action="update" if response.status_code < 300 else "update",
            path=request.path,
            method=request.method,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
        )
