import pytest

from apps.companies.models import Company
from apps.contacts.models import Contact

pytestmark = pytest.mark.django_db


def test_cannot_retrieve_other_org_contact_by_id(admin_client, other_org_client, org):
    contact = Contact.objects.create(organization=org, first_name="Secret", last_name="Person")

    same_org = admin_client.get(f"/api/contacts/{contact.id}/")
    assert same_org.status_code == 200

    cross_org = other_org_client.get(f"/api/contacts/{contact.id}/")
    assert cross_org.status_code == 404


def test_cannot_update_other_org_company(admin_client, other_org_client, org):
    company = Company.objects.create(organization=org, name="Acme")

    response = other_org_client.patch(f"/api/companies/{company.id}/", {"name": "Hacked"}, format="json")
    assert response.status_code == 404
    company.refresh_from_db()
    assert company.name == "Acme"


def test_global_search_only_returns_own_org_results(admin_client, other_org_client, org, other_org):
    Contact.objects.create(organization=org, first_name="Findme", last_name="Please")
    Contact.objects.create(organization=other_org, first_name="Findme", last_name="TooButNot")

    response = admin_client.get("/api/search/?q=Findme")
    assert response.status_code == 200
    names = [c["full_name"] for c in response.data["contacts"]]
    assert "Findme Please" in names
    assert "Findme TooButNot" not in names
