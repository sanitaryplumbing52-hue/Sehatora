from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.contacts.models import Contact
from apps.core.models import Tag
from apps.core.serializers import TagSerializer


class ContactListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    owner_name = serializers.CharField(source="owner.full_name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Contact
        fields = [
            "id",
            "full_name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "whatsapp",
            "company",
            "company_name",
            "job_title",
            "lead_source",
            "lead_status",
            "lifecycle_stage",
            "owner",
            "owner_name",
            "tags",
            "lead_score",
            "avatar",
            "created_at",
            "last_activity_at",
            "next_follow_up_at",
        ]


class ContactDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    owner_detail = UserSerializer(source="owner", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", many=True, write_only=True, queryset=Tag.objects.none(), required=False
    )
    company_name = serializers.CharField(source="company.name", read_only=True)
    open_deal_count = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            "id",
            "full_name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "whatsapp",
            "company",
            "company_name",
            "job_title",
            "website",
            "address",
            "city",
            "country",
            "lead_source",
            "lead_status",
            "lifecycle_stage",
            "owner",
            "owner_detail",
            "tags",
            "tag_ids",
            "notes",
            "avatar",
            "lead_score",
            "created_at",
            "updated_at",
            "last_activity_at",
            "last_contacted_at",
            "next_follow_up_at",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "open_deal_count",
        ]
        read_only_fields = ["created_at", "updated_at", "last_activity_at", "lead_score"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.core.models import Tag

        self.fields["tag_ids"].child_relation.queryset = Tag.objects.all()

    def get_open_deal_count(self, obj):
        return obj.deals.exclude(stage__is_won=True).exclude(stage__is_lost=True).count()
