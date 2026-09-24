from rest_framework.routers import DefaultRouter
from django.urls import path

from apps.accounts.views import (
    ChangePasswordView,
    LoginView,
    MeView,
    RefreshView,
    RoleViewSet,
    TeamViewSet,
    UserViewSet,
    logout_view,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("roles", RoleViewSet, basename="role")
router.register("teams", TeamViewSet, basename="team")

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", logout_view, name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
] + router.urls
