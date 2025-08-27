from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters import rest_framework as filters

from app.common.permissions import IsOwnerOrReadOnly
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer


class ProductFilter(filters.FilterSet):
    company = filters.NumberFilter(field_name='company__id')
    category = filters.CharFilter(field_name='category__slug')
    is_service = filters.BooleanFilter()
    price_min = filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = filters.NumberFilter(field_name='price', lookup_expr='lte')
    in_stock = filters.BooleanFilter()
    
    class Meta:
        model = Product
        fields = ['company', 'category', 'is_service', 'price_min', 'price_max', 'in_stock']


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True, company__status='APPROVED')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['title', 'description', 'sku']
    ordering_fields = ['title', 'price', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateUpdateSerializer
        return ProductListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # Get the user's company
        user_companies = self.request.user.companies.filter(status__in=['APPROVED', 'PENDING'])
        if not user_companies.exists():
            return Response(
                {'error': 'You must have an approved company to create products'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the first company (suppliers typically have one company)
        company = user_companies.first()
        serializer.save(company=company)


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # Users can only edit products from their own companies
            return Product.objects.filter(company__owner=self.request.user)
        return Product.objects.all()


class MyProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['title', 'description', 'sku']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Product.objects.filter(company__owner=self.request.user)