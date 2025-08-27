from rest_framework import serializers
from .models import Company, Branch, Employee
from app.categories.serializers import CategorySerializer


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'address', 'latitude', 'longitude', 'phone', 'created_at']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'position', 'phone', 'email', 'created_at']


class CompanyListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'logo', 'description', 'categories', 'city', 
            'rating', 'status', 'owner_name', 'is_favorite', 'created_at'
        ]
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(user=request.user).exists()
        return False


class CompanyDetailSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    branches = BranchSerializer(many=True, read_only=True)
    employees = EmployeeSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    is_favorite = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'logo', 'description', 'categories', 'contacts',
            'legal_info', 'payment_methods', 'work_schedule', 'staff_count',
            'branches_count', 'latitude', 'longitude', 'city', 'address',
            'status', 'rating', 'owner_name', 'is_favorite', 'reviews_count',
            'branches', 'employees', 'created_at', 'updated_at'
        ]
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(user=request.user).exists()
        return False
    
    def get_reviews_count(self, obj):
        return obj.reviews.filter(status='APPROVED').count()


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'name', 'logo', 'description', 'categories', 'contacts',
            'legal_info', 'payment_methods', 'work_schedule', 'staff_count',
            'branches_count', 'latitude', 'longitude', 'city', 'address'
        ]
    
    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        company = Company.objects.create(**validated_data)
        company.categories.set(categories)
        return company
    
    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if categories is not None:
            instance.categories.set(categories)
        
        return instance