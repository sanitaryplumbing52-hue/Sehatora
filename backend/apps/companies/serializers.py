from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.companies.models import Company
from apps.core.models import Tag
from apps.core.serializers import TagSerializer


class CompanyListSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.full_name", read_only=True)
    contact_count = serializers.IntegerField(source="contacts.count", read_only=True)
    deal_count = serializers.IntegerField(source="deals.count", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "website",
            "industry",
            "phone",
            "email",
            "city",
            "country",
            "employees",
            "owner",
            "owner_name",
            "tags",
            "contact_count",
            "deal_count",
            "logo",
            "created_at",
            "last_activity_at",
        ]


class CompanyDetailSerializer(serializers.ModelSerializer):
    owner_detail = UserSerializer(source="owner", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", many=True, write_only=True, queryset=Tag.objects.none(), required=False
    )
    contact_count = serializers.IntegerField(source="contacts.count", read_only=True)
    deal_count = serializers.IntegerField(source="deals.count", read_only=True)
    open_deal_value = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "website",
            "industry",
            "phone",
            "email",
            "address",
            "city",
            "country",
            "employees",
            "annual_revenue",
            "owner",
            "owner_detail",
            "tags",
            "tag_ids",
            "notes",
            "logo",
            "contact_count",
            "deal_count",
            "open_deal_value",
            "created_at",
            "updated_at",
            "last_activity_at",
        ]
        read_only_fields = ["created_at", "updated_at", "last_activity_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.core.models import Tag

        self.fields["tag_ids"].child_relation.queryset = Tag.objects.all()

    def get_open_deal_value(self, obj):
        from django.db.models import Sum

        return obj.deals.exclude(stage__is_won=True).exclude(stage__is_lost=True).aggregate(total=Sum("amount"))[
            "total"
        ] or 0
