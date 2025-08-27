from rest_framework import serializers
from .models import Ad, Action


class AdSerializer(serializers.ModelSerializer):
    is_current = serializers.ReadOnlyField()
    
    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'image', 'url', 'position', 'is_active',
            'starts_at', 'ends_at', 'is_current', 'created_at'
        ]


class ActionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    is_current = serializers.ReadOnlyField()
    
    class Meta:
        model = Action
        fields = [
            'id', 'title', 'description', 'company_name', 'is_active',
            'starts_at', 'ends_at', 'is_current', 'created_at'
        ]


class ActionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Action
        fields = [
            'title', 'description', 'starts_at', 'ends_at', 'is_active'
        ]