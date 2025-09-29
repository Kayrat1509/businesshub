from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import JsonResponse, HttpResponse
import pandas as pd
import io
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError

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
    on_sale = filters.BooleanFilter()
    # добавлен фильтр по городу компании
    city = filters.CharFilter(field_name="company__city", lookup_expr="iexact")
    # добавлен фильтр по стране компании
    country = filters.CharFilter(field_name="company__country", lookup_expr="iexact")

    class Meta:
        model = Product
        fields = [
            "company",
            "category",
            "is_service",
            "price_min",
            "price_max",
            "in_stock",
            "on_sale",  # добавлен фильтр по акциям
            "city",  # добавлен фильтр по городу
            "country",  # добавлен фильтр по стране
        ]


class ProductListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["title", "description", "sku"]
    # добавлена сортировка по цене (по возрастанию и убыванию)
    ordering_fields = ["title", "price", "created_at", "rating"]
    ordering = ["-rating", "-created_at"]  # сортировка по умолчанию
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """
        Фильтрация продуктов в зависимости от пользователя:
        - Неаутентифицированные: только активные продукты одобренных компаний
        - Обычные пользователи: могут видеть все активные продукты для просмотра
        - Суперпользователи: видят все продукты
        """
        if self.request.user.is_authenticated and self.request.user.is_superuser:
            return Product.objects.select_related('company', 'category').prefetch_related('product_images').all()

        # Для всех остальных - только активные продукты одобренных компаний
        return Product.objects.select_related('company', 'category').prefetch_related('product_images').filter(is_active=True, company__status="APPROVED")

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
        Компания определяется на основе выбранной компании пользователя.
        """
        from app.companies.models import Company
        from rest_framework.exceptions import ValidationError

        # Получаем company_id из запроса
        company_id = self.request.data.get('company_id')

        # Суперпользователи могут создавать продукты для любой компании
        if self.request.user.is_superuser:
            if company_id:
                try:
                    company = Company.objects.get(id=company_id)
                    serializer.save(company=company)
                    return
                except Company.DoesNotExist:
                    raise ValidationError(
                        {"error": "Указанная компания не найдена"}
                    )

        # Для обычных пользователей получаем компании, принадлежащие пользователю
        user_companies = Company.objects.filter(owner=self.request.user)

        if user_companies.count() == 0:
            raise ValidationError(
                {"error": "У вас нет компании для создания продуктов"}
            )
        elif user_companies.count() == 1:
            # Если у пользователя одна компания, используем её
            user_company = user_companies.first()
            serializer.save(company=user_company)
        else:
            # Если у пользователя несколько компаний, требуем указать company_id
            if not company_id:
                raise ValidationError(
                    {"error": "У вас несколько компаний. Пожалуйста, выберите компанию"}
                )

            # Проверяем что указанная компания принадлежит пользователю
            try:
                user_company = user_companies.get(id=company_id)
                serializer.save(company=user_company)
            except Company.DoesNotExist:
                raise ValidationError(
                    {"error": "Указанная компания не найдена или не принадлежит вам"}
                )


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('company', 'category').prefetch_related('product_images').all()
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
            return Product.objects.select_related('company', 'category').prefetch_related('product_images').filter(company__owner=self.request.user)
        return Product.objects.select_related('company', 'category').prefetch_related('product_images').all()


class MyProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["title", "description", "sku"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.select_related('company', 'category').prefetch_related('product_images').filter(company__owner=self.request.user)


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
    products = products.select_related('company', 'category').prefetch_related('product_images').order_by('-rating', '-created_at')[:20]

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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_import_template(request):
    """
    Скачать шаблон Excel для импорта товаров
    """
    # Создаем DataFrame с примерами данных
    template_data = {
        'name': [
            'Смартфон Samsung Galaxy S24',
            'Ноутбук MacBook Pro 14"',
            'Беспроводные наушники AirPods Pro',
            'Планшет iPad Air 10.9"'
        ],
        'description': [
            'Флагманский смартфон с камерой 200MP и процессором Snapdragon 8 Gen 3',
            'Профессиональный ноутбук для разработки и дизайна с чипом M3 Pro',
            'Наушники с активным шумоподавлением и пространственным звуком',
            'Универсальный планшет для работы и творчества с поддержкой Apple Pencil'
        ],
        'price': [350000.00, 2100.00, 85000.00, 450.00],
        'sku': ['SMS24-256GB-BLK', 'MBP14-M3PRO-512', 'APP-PRO-2GEN', 'IPAD-AIR-256-WF'],
        'category': ['Электроника', 'Компьютеры', 'Аксессуары', 'Планшеты'],
        'currency': ['KZT', 'USD', 'RUB', 'USD'],
        'in_stock': ['Да', 'Да', 'Да', 'Нет']
    }

    df = pd.DataFrame(template_data)

    # Создаем Excel файл в памяти
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Товары')

        # Получаем рабочую книгу для форматирования
        workbook = writer.book
        worksheet = writer.sheets['Товары']

        # Автоматическая настройка ширины колонок
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width

    output.seek(0)

    # Создаем HTTP ответ с Excel файлом
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="template_import_products.xlsx"'

    return response


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def import_products_from_excel(request):
    """
    Импорт товаров из Excel файла
    """
    if 'file' not in request.FILES:
        return Response({
            'success': False,
            'error': 'Файл не найден'
        }, status=status.HTTP_400_BAD_REQUEST)

    excel_file = request.FILES['file']

    # Проверяем расширение файла
    if not excel_file.name.endswith(('.xlsx', '.xls')):
        return Response({
            'success': False,
            'error': 'Поддерживаются только файлы Excel (.xlsx, .xls)'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Читаем Excel файл
        df = pd.read_excel(excel_file)

        # Нормализуем заголовки колонок (приводим к нижнему регистру и убираем пробелы)
        df.columns = df.columns.str.lower().str.strip()

        # Проверяем наличие обязательной колонки 'name'
        if 'name' not in df.columns:
            return Response({
                'success': False,
                'error': 'Обязательная колонка "name" не найдена в файле'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Получаем компанию пользователя
        from app.companies.models import Company
        user_companies = Company.objects.filter(owner=request.user)

        if user_companies.count() == 0:
            return Response({
                'success': False,
                'error': 'У вас нет компании для импорта товаров'
            }, status=status.HTTP_400_BAD_REQUEST)
        elif user_companies.count() == 1:
            user_company = user_companies.first()
        else:
            # Если у пользователя несколько компаний, берем первую или используем company_id из запроса
            company_id = request.data.get('company_id')
            if company_id:
                try:
                    user_company = user_companies.get(id=company_id)
                except Company.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': 'Указанная компания не найдена'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                user_company = user_companies.first()

        # Получаем категории для соответствия
        from app.categories.models import Category
        categories_dict = {cat.name.lower(): cat for cat in Category.objects.all()}

        imported_products = []
        skipped_products = []

        # Обрабатываем каждую строку
        for index, row in df.iterrows():
            # Пропускаем строки без названия
            if pd.isna(row['name']) or str(row['name']).strip() == '':
                skipped_products.append(f"Строка {index + 2}: отсутствует название товара")
                continue

            try:
                # Подготавливаем данные для создания продукта
                product_data = {
                    'title': str(row['name']).strip(),
                    'company': user_company
                }

                # Опциональные поля
                if 'description' in df.columns and not pd.isna(row['description']):
                    product_data['description'] = str(row['description']).strip()
                else:
                    product_data['description'] = ''

                if 'price' in df.columns and not pd.isna(row['price']):
                    try:
                        product_data['price'] = float(row['price'])
                    except (ValueError, TypeError):
                        pass

                if 'sku' in df.columns and not pd.isna(row['sku']):
                    product_data['sku'] = str(row['sku']).strip()

                if 'currency' in df.columns and not pd.isna(row['currency']):
                    currency = str(row['currency']).upper().strip()
                    if currency in ['KZT', 'RUB', 'USD']:
                        product_data['currency'] = currency

                if 'in_stock' in df.columns and not pd.isna(row['in_stock']):
                    # Обработка различных значений для поля in_stock
                    stock_value = str(row['in_stock']).lower().strip()
                    if stock_value in ['да', 'yes', 'true', '1', 'есть', 'в наличии']:
                        product_data['in_stock'] = True
                    elif stock_value in ['нет', 'no', 'false', '0', 'нету', 'отсутствует']:
                        product_data['in_stock'] = False
                    else:
                        # По умолчанию считаем, что товар в наличии
                        product_data['in_stock'] = True

                # Обработка категории
                if 'category' in df.columns and not pd.isna(row['category']):
                    category_name = str(row['category']).lower().strip()
                    if category_name in categories_dict:
                        product_data['category'] = categories_dict[category_name]

                # Создаем продукт
                product = Product.objects.create(**product_data)
                imported_products.append({
                    'id': product.id,
                    'name': product.title,
                    'price': product.price,
                    'currency': product.currency
                })

            except Exception as e:
                skipped_products.append(f"Строка {index + 2}: {str(e)}")

        return Response({
            'success': True,
            'message': f'Импортировано {len(imported_products)} товаров',
            'imported_count': len(imported_products),
            'skipped_count': len(skipped_products),
            'imported_products': imported_products,
            'skipped_products': skipped_products
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'error': f'Ошибка при обработке файла: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def filter_options(request):
    """
    Возвращает доступные варианты для фильтров на странице акций
    """
    from app.categories.models import Category

    try:
        # Получаем товары в акции для фильтров
        sale_products = Product.objects.filter(on_sale=True, is_active=True)

        # Получаем уникальные категории
        categories = Category.objects.filter(
            products__in=sale_products
        ).distinct().values('id', 'name', 'slug')

        # Получаем уникальные города
        cities = list(set(sale_products.values_list('company__city', flat=True)))
        cities = [city for city in cities if city]  # Убираем пустые значения

        # Получаем уникальные страны
        countries = list(set(sale_products.values_list('company__country', flat=True)))
        countries = [country for country in countries if country]  # Убираем пустые значения

        return Response({
            'categories': list(categories),
            'cities': sorted(cities),
            'countries': sorted(countries)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Ошибка получения опций фильтров: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
