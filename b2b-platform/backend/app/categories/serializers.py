from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'is_active', 'full_path', 'children', 'created_at']
        read_only_fields = ['slug', 'created_at']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True).data


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'children']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategoryTreeSerializer(children, many=True).data