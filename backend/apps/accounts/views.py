from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.models import LoginHistory, Role, Team, User
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    MeSerializer,
    RoleSerializer,
    SehatoraTokenObtainPairSerializer,
    TeamSerializer,
    UserCreateSerializer,
    UserSerializer,
)
from apps.core.models import AuditLog
from apps.core.permissions import HasModulePermission


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class LoginView(TokenObtainPairView):
    serializer_class = SehatoraTokenObtainPairSerializer
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        username = request.data.get("username")
        ip = _client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")[:512]

        if response.status_code == 200:
            user = User.objects.filter(username=username).first()
            if user:
                user.last_login_ip = ip
                user.save(update_fields=["last_login_ip"])
                LoginHistory.objects.create(user=user, ip_address=ip, user_agent=ua, success=True)
                AuditLog.objects.create(
                    organization=user.organization, user=user, action="login", ip_address=ip, user_agent=ua
                )
        else:
            user = User.objects.filter(username=username).first()
            if user:
                LoginHistory.objects.create(user=user, ip_address=ip, user_agent=ua, success=False)
                AuditLog.objects.create(
                    organization=user.organization, user=user, action="login_failed", ip_address=ip, user_agent=ua
                )
        return response


class RefreshView(TokenRefreshView):
    throttle_scope = "auth"


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password updated."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get("refresh")
    if refresh_token:
        try:
            from rest_framework_simplejwt.tokens import RefreshToken

            RefreshToken(refresh_token).blacklist()
        except Exception:
            pass
    AuditLog.objects.create(
        organization=request.user.organization,
        user=request.user,
        action="logout",
        ip_address=_client_ip(request),
    )
    return Response(status=status.HTTP_205_RESET_CONTENT)


class OrgScopedModelViewSet(viewsets.ModelViewSet):
    """For accounts-app models (User/Role/Team) which are not TenantModel
    subclasses but still need to be scoped to request.user.organization."""

    permission_classes = [HasModulePermission]
    module = "team"

    def get_queryset(self):
        return self.queryset.model.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class UserViewSet(OrgScopedModelViewSet):
    queryset = User.objects.all()
    filterset_fields = ["role", "team", "is_active"]
    search_fields = ["first_name", "last_name", "email", "username"]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer


class RoleViewSet(OrgScopedModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionError("System roles cannot be deleted.")
        instance.delete()


class TeamViewSet(OrgScopedModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
