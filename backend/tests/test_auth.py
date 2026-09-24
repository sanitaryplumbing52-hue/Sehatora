import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_login_success(admin_user):
    client = APIClient()
    response = client.post(
        reverse("auth-login"), {"username": "admin", "password": "Password#12345"}, format="json"
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
    assert response.data["user"]["email"] == "admin@test.local"


def test_login_wrong_password(admin_user):
    client = APIClient()
    response = client.post(reverse("auth-login"), {"username": "admin", "password": "wrong"}, format="json")
    assert response.status_code == 401


def test_me_requires_auth():
    client = APIClient()
    response = client.get(reverse("auth-me"))
    assert response.status_code == 401


def test_me_returns_profile_and_permissions(admin_client):
    response = admin_client.get(reverse("auth-me"))
    assert response.status_code == 200
    assert response.data["username"] == "admin"
    assert "permissions" in response.data


def test_login_records_login_history(admin_user):
    from apps.accounts.models import LoginHistory

    client = APIClient()
    client.post(reverse("auth-login"), {"username": "admin", "password": "Password#12345"}, format="json")
    assert LoginHistory.objects.filter(user=admin_user, success=True).exists()


def test_change_password(admin_client, admin_user):
    response = admin_client.post(
        reverse("auth-change-password"),
        {"old_password": "Password#12345", "new_password": "NewPassword#98765"},
        format="json",
    )
    assert response.status_code == 200
    admin_user.refresh_from_db()
    assert admin_user.check_password("NewPassword#98765")
