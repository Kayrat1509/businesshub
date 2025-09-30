from rest_framework import serializers

from .models import Action, Ad


class AdSerializer(serializers.ModelSerializer):
    is_current = serializers.ReadOnlyField()

    class Meta:
        model = Ad
        fields = [
            "id",
            "title",
            "image",
            "url",
            "position",
            "is_active",
            "starts_at",
            "ends_at",
            "is_current",
            "created_at",
        ]


class ActionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    is_current = serializers.ReadOnlyField()
    # Добавляем список ID товаров и их количество
    products = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Action
        fields = [
            "id",
            "title",
            "description",
            "company_name",
            "is_active",
            "starts_at",
            "ends_at",
            "is_current",
            "products",
            "products_count",
            "created_at",
        ]

    def get_products_count(self, obj):
        """Возвращает количество товаров в акции"""
        return obj.products.count()


class ActionCreateUpdateSerializer(serializers.ModelSerializer):
    # Позволяем добавлять товары при создании/обновлении акции (опционально)
    products = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        read_only=True  # Управление товарами через отдельные эндпоинты
    )

    class Meta:
        model = Action
        fields = ["title", "description", "starts_at", "ends_at", "is_active", "products"]
