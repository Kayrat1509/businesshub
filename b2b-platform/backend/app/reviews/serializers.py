from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_email = serializers.CharField(source="author.email", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "rating",
            "text",
            "status",
            "admin_comment",
            "author_name",
            "author_email",
            "company_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "author_name",
            "author_email",
            "company_name",
            "status",
            "admin_comment",
        ]

    def get_author_name(self, obj):
        """Получить отображаемое имя автора"""
        if obj.author.first_name and obj.author.last_name:
            return f"{obj.author.first_name} {obj.author.last_name}"
        elif obj.author.first_name:
            return obj.author.first_name
        elif obj.author.username:
            return obj.author.username
        else:
            return obj.author.email.split('@')[0] if obj.author.email else 'Аноним'


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["company", "rating", "text"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class ReviewModerationSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "rating",
            "text",
            "status",
            "admin_comment",
            "author_name",
            "company_name",
            "created_at",
        ]

    def get_author_name(self, obj):
        """Получить отображаемое имя автора"""
        if obj.author.first_name and obj.author.last_name:
            return f"{obj.author.first_name} {obj.author.last_name}"
        elif obj.author.first_name:
            return obj.author.first_name
        elif obj.author.username:
            return obj.author.username
        else:
            return obj.author.email.split('@')[0] if obj.author.email else 'Аноним'

    def update(self, instance, validated_data):
        instance.status = validated_data.get("status", instance.status)
        instance.admin_comment = validated_data.get(
            "admin_comment", instance.admin_comment
        )
        instance.save()
        return instance
