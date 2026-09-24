from rest_framework import serializers

from apps.core.models import CustomField, CustomFieldValue, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color"]


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = ["id", "entity", "label", "key", "field_type", "options", "is_required", "order"]


class CustomFieldValueSerializer(serializers.ModelSerializer):
    field_key = serializers.CharField(source="field.key", read_only=True)

    class Meta:
        model = CustomFieldValue
        fields = ["id", "field", "field_key", "entity_id", "value"]
