import pytest

from apps.contacts.models import Contact
from apps.leads.models import Lead

pytestmark = pytest.mark.django_db


def test_score_event_updates_lead_and_contact_score(admin_client, org):
    contact = Contact.objects.create(organization=org, first_name="Lee", last_name="Kim")
    lead = Lead.objects.create(organization=org, contact=contact, source="website")

    response = admin_client.post(
        f"/api/leads/{lead.id}/score-event/", {"event_type": "form_submission"}, format="json"
    )
    assert response.status_code == 200
    assert response.data["score"] == 10

    contact.refresh_from_db()
    assert contact.lead_score == 10

    response2 = admin_client.post(
        f"/api/leads/{lead.id}/score-event/", {"event_type": "meeting_booked"}, format="json"
    )
    assert response2.data["score"] == 30


def test_convert_lead_to_deal_creates_deal_in_default_pipeline(admin_client, org, pipeline):
    contact = Contact.objects.create(organization=org, first_name="Amir", last_name="Noor")
    lead = Lead.objects.create(organization=org, contact=contact, source="referral")

    response = admin_client.post(f"/api/leads/{lead.id}/convert_to_deal/", {"amount": "1500"}, format="json")
    assert response.status_code == 201, response.data
    assert response.data["pipeline"] == pipeline.id

    lead.refresh_from_db()
    assert lead.status == "qualified"
    assert lead.converted_deal_id is not None


def test_invalid_score_event_type_rejected(admin_client, org):
    contact = Contact.objects.create(organization=org, first_name="X", last_name="Y")
    lead = Lead.objects.create(organization=org, contact=contact)
    response = admin_client.post(f"/api/leads/{lead.id}/score-event/", {"event_type": "not_a_rule"}, format="json")
    assert response.status_code == 400
