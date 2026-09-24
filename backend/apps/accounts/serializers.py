from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import Role, Team, User


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "is_system", "permissions"]
        read_only_fields = ["is_system"]


class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source="members.count", read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "description", "manager", "member_count"]


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    team_name = serializers.CharField(source="team.name", read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "avatar",
            "job_title",
            "role",
            "role_name",
            "team",
            "team_name",
            "is_active",
            "is_org_owner",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["date_joined", "last_login", "is_org_owner"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "role", "team", "job_title", "phone"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        request = self.context["request"]
        user = User(organization=request.user.organization, **validated_data)
        user.set_password(password)
        user.save()
        return user


class MeSerializer(UserSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["organization", "organization_name", "permissions", "is_superuser"]

    def get_permissions(self, obj):
        if obj.is_superuser:
            from apps.accounts.models import MODULES, PERMISSION_ACTIONS

            return {m: list(PERMISSION_ACTIONS) for m in MODULES}
        return obj.role.permissions if obj.role else {}


class SehatoraTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds basic profile fields to the JWT payload so the frontend can
    render the sidebar/avatar without a second round-trip on load."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["full_name"] = user.full_name
        token["org_id"] = str(user.organization_id) if user.organization_id else None
        token["org_name"] = user.organization.name if user.organization else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = MeSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
