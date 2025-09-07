from rest_framework import serializers

from app.categories.serializers import CategorySerializer

from .models import Tender, TenderAttachment


class TenderAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderAttachment
        fields = ["id", "file", "filename", "file_size", "uploaded_at"]


class TenderListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    company = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "city",
            "budget_min",
            "budget_max",
            "deadline_date",
            "status",
            "author_name",
            "company",
            "created_at",
        ]

    def get_company(self, obj):
        if obj.company:
            return {
                "id": obj.company.id,
                "name": obj.company.name,
                "logo": obj.company.logo.url if obj.company.logo else None,
            }
        return None


class TenderDetailSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    tender_attachments = TenderAttachmentSerializer(many=True, read_only=True)
    company = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "city",
            "budget_min",
            "budget_max",
            "deadline_date",
            "status",
            "attachments",
            "tender_attachments",
            "author_name",
            "company",
            "admin_comment",
            "created_at",
            "updated_at",
        ]

    def get_company(self, obj):
        if obj.company:
            return {
                "id": obj.company.id,
                "name": obj.company.name,
                "logo": obj.company.logo.url if obj.company.logo else None,
            }
        return None


class TenderCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tender
        fields = [
            "title",
            "description",
            "categories",
            "city",
            "budget_min",
            "budget_max",
            "deadline_date",
            "attachments",
        ]

    def create(self, validated_data):
        categories = validated_data.pop("categories", [])
        tender = Tender.objects.create(**validated_data)
        tender.categories.set(categories)
        return tender

    def update(self, instance, validated_data):
        categories = validated_data.pop("categories", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories is not None:
            instance.categories.set(categories)

        return instance


class TenderModerationSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Tender
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "city",
            "budget_min",
            "budget_max",
            "deadline_date",
            "status",
            "admin_comment",
            "author_name",
            "created_at",
        ]

    def update(self, instance, validated_data):
        instance.status = validated_data.get("status", instance.status)
        instance.admin_comment = validated_data.get(
            "admin_comment", instance.admin_comment
        )
        instance.save()
        return instance
