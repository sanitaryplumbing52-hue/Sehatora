import pytest

from apps.contacts.models import Contact
from apps.deals.models import Deal

pytestmark = pytest.mark.django_db


def test_create_deal_and_kanban_board(admin_client, org, pipeline):
    contact = Contact.objects.create(organization=org, first_name="Kim", last_name="Park")
    new_stage = pipeline.stages.get(name="New")

    response = admin_client.post(
        "/api/deals/",
        {
            "name": "Big Deal",
            "pipeline": str(pipeline.id),
            "stage": str(new_stage.id),
            "contact": str(contact.id),
            "amount": "10000.00",
        },
        format="json",
    )
    assert response.status_code == 201, response.data

    board = admin_client.get(f"/api/deals/kanban/?pipeline={pipeline.id}")
    assert board.status_code == 200
    new_column = next(c for c in board.data["stages"] if c["name"] == "New")
    assert new_column["total_value"] == 10000
    assert len(new_column["deals"]) == 1


def test_move_stage_updates_probability_and_logs_activity(admin_client, org, pipeline):
    contact = Contact.objects.create(organization=org, first_name="Kim", last_name="Park")
    new_stage = pipeline.stages.get(name="New")
    won_stage = pipeline.stages.get(name="Won")

    deal = Deal.objects.create(
        organization=org, name="Deal 1", pipeline=pipeline, stage=new_stage, contact=contact, amount=5000
    )

    response = admin_client.post(f"/api/deals/{deal.id}/move-stage/", {"stage": str(won_stage.id)}, format="json")
    assert response.status_code == 200
    deal.refresh_from_db()
    assert deal.stage_id == won_stage.id
    assert deal.probability == 100
    assert deal.closed_at is not None

    timeline = admin_client.get(f"/api/deals/{deal.id}/timeline/")
    assert any(item["activity_type"] == "deal_stage_change" for item in timeline.data)


def test_deals_scoped_to_organization(admin_client, sales_client, org, other_org, pipeline):
    from apps.deals.models import Pipeline, PipelineStage

    other_pipeline = Pipeline.objects.create(organization=other_org, name="Other Pipeline")
    other_stage = PipelineStage.objects.create(organization=other_org, pipeline=other_pipeline, name="Stage", order=0)
    Deal.objects.create(organization=other_org, name="Not Mine", pipeline=other_pipeline, stage=other_stage, amount=1)

    new_stage = pipeline.stages.get(name="New")
    Deal.objects.create(organization=org, name="Mine", pipeline=pipeline, stage=new_stage, amount=1)

    response = admin_client.get("/api/deals/")
    names = [d["name"] for d in response.data["results"]]
    assert "Mine" in names
    assert "Not Mine" not in names
