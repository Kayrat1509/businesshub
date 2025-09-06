from rest_framework import serializers

from app.categories.serializers import CategorySerializer

from .models import Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    primary_image = serializers.SerializerMethodField()

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
            "primary_image",
            "rating",
            "in_stock",
            "created_at",
        ]

    def get_primary_image(self, obj):
        primary_image = obj.product_images.filter(is_primary=True).first()
        if primary_image:
            return self.context["request"].build_absolute_uri(primary_image.image.url)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    product_images = ProductImageSerializer(many=True, read_only=True)

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
            "product_images",
            "images",
            "rating",
            "in_stock",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    # Поле company только для чтения - будет присваиваться автоматически
    company = serializers.CharField(source='company.name', read_only=True)
    
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
            "images",
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
        Создание продукта с автоматическим присваиванием компании.
        Компания передается через context из ViewSet.
        """
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            # Суперпользователи могут указывать компанию вручную
            if request.user.is_superuser and 'company' in validated_data:
                return Product.objects.create(**validated_data)
            
            # Для обычных пользователей получаем компанию автоматически
            try:
                from app.companies.models import Company
                user_company = Company.objects.get(owner=request.user)
                validated_data['company'] = user_company
            except Company.DoesNotExist:
                raise serializers.ValidationError(
                    "У вас нет компании для создания продуктов"
                )
        
        return Product.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Обновление продукта с проверкой прав доступа.
        Компанию менять нельзя для обычных пользователей.
        """
        request = self.context.get('request')
        
        # Для обычных пользователей убираем company из validated_data
        if request and not request.user.is_superuser:
            validated_data.pop('company', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def to_representation(self, instance):
        """Добавляем информацию о компании в ответ"""
        data = super().to_representation(instance)
        if instance.company:
            data['company_id'] = instance.company.id
            data['company'] = instance.company.name
        return data
