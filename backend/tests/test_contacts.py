import pytest

from apps.contacts.models import Contact

pytestmark = pytest.mark.django_db


def test_create_contact(admin_client, org):
    response = admin_client.post(
        "/api/contacts/",
        {"first_name": "Jane", "last_name": "Doe", "email": "jane@example.com", "lead_source": "website"},
        format="json",
    )
    assert response.status_code == 201, response.data
    contact = Contact.all_objects.get(id=response.data["id"])
    assert contact.organization_id == org.id
    assert contact.full_name == "Jane Doe"


def test_list_contacts_scoped_to_org(admin_client, org, other_org):
    Contact.objects.create(organization=org, first_name="In", last_name="Org")
    Contact.objects.create(organization=other_org, first_name="Other", last_name="Org")

    response = admin_client.get("/api/contacts/")
    assert response.status_code == 200
    names = [c["full_name"] for c in response.data["results"]]
    assert "In Org" in names
    assert "Other Org" not in names


def test_contact_timeline_logs_creation_activity(admin_client):
    response = admin_client.post(
        "/api/contacts/", {"first_name": "Sam", "last_name": "Lee"}, format="json"
    )
    contact_id = response.data["id"]
    timeline = admin_client.get(f"/api/contacts/{contact_id}/timeline/")
    assert timeline.status_code == 200
    assert any(item["activity_type"] == "created" for item in timeline.data)


def test_sales_role_can_create_but_viewer_cannot(sales_client, viewer_client):
    ok = sales_client.post("/api/contacts/", {"first_name": "A", "last_name": "B"}, format="json")
    assert ok.status_code == 201

    forbidden = viewer_client.post("/api/contacts/", {"first_name": "C", "last_name": "D"}, format="json")
    assert forbidden.status_code == 403


def test_viewer_can_list_contacts(viewer_client, org):
    Contact.objects.create(organization=org, first_name="Read", last_name="Only")
    response = viewer_client.get("/api/contacts/")
    assert response.status_code == 200
    assert response.data["count"] == 1
