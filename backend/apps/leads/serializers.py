from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.contacts.serializers import ContactListSerializer
from apps.core.models import Tag
from apps.core.serializers import TagSerializer
from apps.leads.models import Lead, LeadScoreEvent


class LeadListSerializer(serializers.ModelSerializer):
    contact_detail = ContactListSerializer(source="contact", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    owner_name = serializers.CharField(source="owner.full_name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "contact",
            "contact_detail",
            "company",
            "company_name",
            "source",
            "status",
            "owner",
            "owner_name",
            "score",
            "tags",
            "next_follow_up_at",
            "created_at",
        ]


class LeadDetailSerializer(serializers.ModelSerializer):
    contact_detail = ContactListSerializer(source="contact", read_only=True)
    owner_detail = UserSerializer(source="owner", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", many=True, write_only=True, queryset=Tag.objects.none(), required=False
    )

    class Meta:
        model = Lead
        fields = [
            "id",
            "contact",
            "contact_detail",
            "company",
            "source",
            "status",
            "owner",
            "owner_detail",
            "score",
            "tags",
            "tag_ids",
            "notes",
            "utm_campaign",
            "landing_page",
            "next_follow_up_at",
            "converted_deal",
            "lost_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["score", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.core.models import Tag

        self.fields["tag_ids"].child_relation.queryset = Tag.objects.all()


class LeadScoreEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadScoreEvent
        fields = ["id", "lead", "contact", "event_type", "points", "description", "created_at"]
        read_only_fields = ["points", "created_at"]
