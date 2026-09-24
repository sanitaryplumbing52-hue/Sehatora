import pytest
from rest_framework.test import APIClient

from apps.accounts.models import DEFAULT_ROLE_PRESETS, Role, User
from apps.core.models import Organization
from apps.deals.models import Pipeline, PipelineStage


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org", slug="test-org")


@pytest.fixture
def other_org():
    return Organization.objects.create(name="Other Org", slug="other-org")


@pytest.fixture
def roles(org):
    return {
        name: Role.objects.create(organization=org, name=name, permissions=perms, is_system=True)
        for name, perms in DEFAULT_ROLE_PRESETS.items()
    }


@pytest.fixture
def admin_user(org, roles):
    user = User.objects.create_user(
        username="admin",
        email="admin@test.local",
        password="Password#12345",
        organization=org,
        role=roles["Super Admin"],
        is_superuser=True,
        is_staff=True,
    )
    return user


@pytest.fixture
def sales_user(org, roles):
    return User.objects.create_user(
        username="sales",
        email="sales@test.local",
        password="Password#12345",
        organization=org,
        role=roles["Sales"],
    )


@pytest.fixture
def viewer_user(org, roles):
    return User.objects.create_user(
        username="viewer",
        email="viewer@test.local",
        password="Password#12345",
        organization=org,
        role=roles["Viewer"],
    )


@pytest.fixture
def other_org_user(other_org):
    role = Role.objects.create(organization=other_org, name="Super Admin", permissions=DEFAULT_ROLE_PRESETS["Super Admin"])
    return User.objects.create_user(
        username="otheradmin",
        email="otheradmin@test.local",
        password="Password#12345",
        organization=other_org,
        role=role,
        is_superuser=True,
    )


@pytest.fixture
def pipeline(org):
    pipeline = Pipeline.objects.create(organization=org, name="Sales Pipeline", is_default=True)
    PipelineStage.objects.create(organization=org, pipeline=pipeline, name="New", order=0, probability=10)
    PipelineStage.objects.create(organization=org, pipeline=pipeline, name="Won", order=1, probability=100, is_won=True)
    PipelineStage.objects.create(organization=org, pipeline=pipeline, name="Lost", order=2, probability=0, is_lost=True)
    return pipeline


def authed_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_client(admin_user):
    return authed_client(admin_user)


@pytest.fixture
def sales_client(sales_user):
    return authed_client(sales_user)


@pytest.fixture
def viewer_client(viewer_user):
    return authed_client(viewer_user)


@pytest.fixture
def other_org_client(other_org_user):
    return authed_client(other_org_user)
