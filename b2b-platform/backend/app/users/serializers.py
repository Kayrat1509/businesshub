from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password_confirm",
            "role",
            "first_name",
            "last_name",
            "phone",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "role",
            "first_name",
            "last_name",
            "phone",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class FavoriteSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_id = serializers.IntegerField(source="company.id", read_only=True)

    class Meta:
        from .models import Favorite

        model = Favorite
        fields = ["id", "company_id", "company_name", "created_at"]


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        from .models import SearchHistory

        model = SearchHistory
        fields = ["id", "query", "category", "location", "created_at"]
        read_only_fields = ["id", "created_at"]
