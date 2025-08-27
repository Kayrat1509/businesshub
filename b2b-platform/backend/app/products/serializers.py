from rest_framework import serializers
from .models import Product, ProductImage
from app.categories.serializers import CategorySerializer


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'currency', 'is_service',
            'category', 'company_name', 'primary_image', 'in_stock', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        primary_image = obj.product_images.filter(is_primary=True).first()
        if primary_image:
            return self.context['request'].build_absolute_uri(primary_image.image.url)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    product_images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'sku', 'description', 'price', 'currency', 'is_service',
            'category', 'company_name', 'product_images', 'images', 'in_stock',
            'is_active', 'created_at', 'updated_at'
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'title', 'sku', 'description', 'price', 'currency', 'is_service',
            'category', 'images', 'in_stock', 'is_active'
        ]
    
    def create(self, validated_data):
        return Product.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance