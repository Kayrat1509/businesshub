from rest_framework import serializers
from django.db import transaction

from app.categories.serializers import CategorySerializer
from app.common.utils import validate_and_process_image

from .models import Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "created_at"]

    def get_image(self, obj):
        """Возвращает полный URL изображения"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "price",
            "currency",
            "is_service",
            "category",
            "company_name",
            "image",
            "rating",
            "in_stock",
            "created_at",
        ]

    def get_image(self, obj):
        """Возвращает полный URL изображения товара"""
        # Сначала проверяем основное изображение
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url

        # Если основного изображения нет, ищем первичное изображение из ProductImage
        primary_image = obj.product_images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url

        # Если первичного нет, берем первое доступное изображение
        first_image = obj.product_images.first()
        if first_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url

        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "sku",
            "description",
            "price",
            "currency",
            "is_service",
            "category",
            "company_name",
            "image",
            "rating",
            "in_stock",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_image(self, obj):
        """Возвращает полный URL изображения товара"""
        # Сначала проверяем основное изображение
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url

        # Если основного изображения нет, ищем первичное изображение из ProductImage
        primary_image = obj.product_images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url

        # Если первичного нет, берем первое доступное изображение
        first_image = obj.product_images.first()
        if first_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url

        return None


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    # Поле company только для чтения - будет присваиваться автоматически
    company = serializers.CharField(source='company.name', read_only=True)
    # Поле для загрузки одного изображения
    image = serializers.ImageField(required=False, allow_null=True, help_text="Изображение товара")

    class Meta:
        model = Product
        fields = [
            "title",
            "sku",
            "description",
            "price",
            "currency",
            "is_service",
            "category",
            "image",
            "rating",
            "in_stock",
            "is_active",
            "company",  # только для чтения
        ]
        extra_kwargs = {
            'company': {'read_only': True}
        }

    def create(self, validated_data):
        """
        Создание продукта с автоматическим присваиванием компании и обработкой изображения.
        """
        # Извлекаем изображение из validated_data
        image_data = validated_data.pop('image', None)

        request = self.context.get('request')

        if request and request.user.is_authenticated:
            # Суперпользователи могут указывать компанию вручную
            if request.user.is_superuser and 'company' in validated_data:
                product = Product.objects.create(**validated_data)
            else:
                # Для обычных пользователей получаем компанию автоматически
                try:
                    from app.companies.models import Company
                    user_company = Company.objects.get(owner=request.user)
                    validated_data['company'] = user_company
                    product = Product.objects.create(**validated_data)
                except Company.DoesNotExist:
                    raise serializers.ValidationError(
                        "У вас нет компании для создания продуктов"
                    )
        else:
            product = Product.objects.create(**validated_data)

        # Обрабатываем и сохраняем изображение
        if image_data:
            processed_image = validate_and_process_image(image_data)
            product.image = processed_image
            product.save()

        return product

    def update(self, instance, validated_data):
        """
        Обновление продукта с проверкой прав доступа и обработкой изображения.
        """
        # Извлекаем изображение из validated_data
        image_data = validated_data.pop('image', None)

        request = self.context.get('request')

        # Для обычных пользователей убираем company из validated_data
        if request and not request.user.is_superuser:
            validated_data.pop('company', None)

        # Обновляем поля продукта
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Если передано новое изображение, обрабатываем его
        if image_data:
            processed_image = validate_and_process_image(image_data)
            instance.image = processed_image

        instance.save()
        return instance

    def to_representation(self, instance):
        """Добавляем информацию о компании и изображении в ответ"""
        data = super().to_representation(instance)
        if instance.company:
            data['company_id'] = instance.company.id
            data['company'] = instance.company.name

        # Добавляем информацию об изображении
        # Сначала проверяем основное изображение
        if instance.image:
            request = self.context.get('request')
            if request:
                data['image'] = request.build_absolute_uri(instance.image.url)
            else:
                data['image'] = instance.image.url
        else:
            # Если основного изображения нет, ищем первичное изображение из ProductImage
            primary_image = instance.product_images.filter(is_primary=True).first()
            if primary_image:
                request = self.context.get('request')
                if request:
                    data['image'] = request.build_absolute_uri(primary_image.image.url)
                else:
                    data['image'] = primary_image.image.url
            else:
                # Если первичного нет, берем первое доступное изображение
                first_image = instance.product_images.first()
                if first_image:
                    request = self.context.get('request')
                    if request:
                        data['image'] = request.build_absolute_uri(first_image.image.url)
                    else:
                        data['image'] = first_image.image.url

        return data
