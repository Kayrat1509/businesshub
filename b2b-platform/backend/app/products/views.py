from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import JsonResponse

from app.common.permissions import IsOwnerOrReadOnly
# from app.common.services import CurrencyConverter

from .models import Product
from .serializers import (ProductCreateUpdateSerializer,
                          ProductDetailSerializer, ProductListSerializer)


class ProductFilter(filters.FilterSet):
    company = filters.NumberFilter(field_name="company__id")
    category = filters.CharFilter(field_name="category__slug")
    is_service = filters.BooleanFilter()
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = filters.BooleanFilter()

    class Meta:
        model = Product
        fields = [
            "company",
            "category",
            "is_service",
            "price_min",
            "price_max",
            "in_stock",
        ]


class ProductListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["title", "description", "sku"]
    ordering_fields = ["title", "price", "created_at", "rating"]
    ordering = ["-rating", "-created_at"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """
        Фильтрация продуктов в зависимости от пользователя:
        - Неаутентифицированные: только активные продукты одобренных компаний
        - Обычные пользователи: могут видеть все активные продукты для просмотра
        - Суперпользователи: видят все продукты
        """
        if self.request.user.is_authenticated and self.request.user.is_superuser:
            return Product.objects.all()
        
        # Для всех остальных - только активные продукты одобренных компаний
        return Product.objects.filter(is_active=True, company__status="APPROVED")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductCreateUpdateSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        """
        Автоматическое присваивание компании при создании продукта.
        Компания определяется через Company.objects.get(owner=request.user)
        """
        try:
            from app.companies.models import Company
            
            # Суперпользователи могут создавать продукты для любой компании
            if self.request.user.is_superuser:
                # Если company_id передан в запросе, используем его
                company_id = self.request.data.get('company_id')
                if company_id:
                    try:
                        company = Company.objects.get(id=company_id)
                        serializer.save(company=company)
                        return
                    except Company.DoesNotExist:
                        pass
            
            # Для обычных пользователей получаем компанию автоматически
            user_company = Company.objects.get(owner=self.request.user)
            serializer.save(company=user_company)
            
        except Company.DoesNotExist:
            # Если у пользователя нет компании, возвращаем ошибку
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"error": "У вас нет компании для создания продуктов"}
            )


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # Users can only edit products from their own companies
            return Product.objects.filter(company__owner=self.request.user)
        return Product.objects.all()


class MyProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["title", "description", "sku"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(company__owner=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def products_by_category(request, category_name):
    """
    Get products by category name with search relevance ranking
    """
    # Filter products by category name (exact match or parent category)
    products = Product.objects.filter(
        is_active=True, 
        company__status="APPROVED"
    )
    
    if category_name and category_name.lower() != 'все':
        products = products.filter(
            category__name__icontains=category_name
        )
    
    # Order by rating and relevance
    products = products.order_by('-rating', '-created_at')[:20]
    
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_exchange_rates(request):
    """API endpoint to get current exchange rates"""
    # Temporary fallback rates
    return JsonResponse({
        'success': True,
        'rates': {'KZT': 450.0, 'RUB': 90.0, 'USD': 1.0},
        'base': 'USD'
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def convert_price(request):
    """API endpoint to convert price between currencies"""
    try:
        data = request.data
        amount = float(data.get('amount', 0))
        from_currency = data.get('from_currency', 'USD')
        to_currency = data.get('to_currency', 'USD')
        
        if amount <= 0:
            return JsonResponse({
                'success': False,
                'error': 'Invalid amount'
            }, status=400)
        
        # Simple conversion with fallback rates
        rates = {'KZT': 450.0, 'RUB': 90.0, 'USD': 1.0}
        if from_currency == to_currency:
            converted_amount = amount
        else:
            usd_amount = amount / rates.get(from_currency, 1)
            converted_amount = usd_amount * rates.get(to_currency, 1)
        
        return JsonResponse({
            'success': True,
            'original_amount': amount,
            'original_currency': from_currency,
            'converted_amount': round(converted_amount, 2),
            'target_currency': to_currency
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
