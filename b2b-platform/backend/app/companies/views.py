from django.db.models import Q
from django.http import HttpResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_http_methods
from django import forms
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from django_filters.widgets import BooleanWidget
from rest_framework import generics, permissions, serializers, status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
import json

from app.common.permissions import IsOwnerOrReadOnly, IsSupplierOrAdmin

from .models import Branch, Company, Employee
from .serializers import (BranchSerializer, CompanyCreateUpdateSerializer,
                          CompanyDetailSerializer, CompanyListSerializer,
                          EmployeeSerializer)
from .resources import CompanyResource


class CompanyFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="categories__slug")
    supplier_type = filters.CharFilter(field_name="supplier_type")
    rating_gte = filters.NumberFilter(field_name="rating", lookup_expr="gte")
    has_actions = filters.BooleanFilter(method="filter_has_actions")
    status = filters.CharFilter(field_name="status")
    # Фильтрация по городу (одиночный город)
    city = filters.CharFilter(field_name="city", lookup_expr="iexact")
    # Фильтрация по нескольким городам (CSV формат: cities=Алматы,Астана)
    cities = filters.CharFilter(method="filter_cities")

    class Meta:
        model = Company
        fields = [
            "category",
            "supplier_type",
            "rating_gte",
            "has_actions",
            "status",
            "city",
            "cities",
        ]

    def filter_has_actions(self, queryset, name, value):
        if value:
            return queryset.filter(actions__is_active=True).distinct()
        return queryset

    def filter_cities(self, queryset, name, value):
        """
        Фильтрация по нескольким городам через CSV строку
        Принимает строку вида: 'Алматы,Астана,Шымкент'
        """
        if not value:
            return queryset

        # Разделяем строку по запятым и убираем лишние пробелы
        cities_list = [city.strip() for city in value.split(',') if city.strip()]

        if not cities_list:
            return queryset

        # Фильтруем по любому из городов из списка (OR логика)
        city_filter = Q()
        for city in cities_list:
            city_filter |= Q(city__iexact=city)

        return queryset.filter(city_filter)


class CompanyListCreateView(generics.ListCreateAPIView):
    queryset = Company.objects.approved()  # Только одобренные компании для публичного API
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CompanyFilter
    search_fields = ["name", "description", "city"]
    ordering_fields = ["name", "rating", "created_at"]
    ordering = ["-rating", "name"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CompanyCreateUpdateSerializer
        return CompanyListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsSupplierOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        
    def create(self, request, *args, **kwargs):
        # Use the create serializer for validation and saving
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full data using detail serializer
        detail_serializer = CompanyDetailSerializer(
            serializer.instance, context={"request": request}
        )
        headers = self.get_success_headers(detail_serializer.data)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class CompanyRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.approved()  # Только одобренные компании для публичного просмотра

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return CompanyCreateUpdateSerializer
        return CompanyDetailSerializer

    def update(self, request, *args, **kwargs):
        # Use the update serializer for validation and saving
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = CompanyCreateUpdateSerializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Return full data using detail serializer
        detail_serializer = CompanyDetailSerializer(
            instance, context={"request": request}
        )
        return Response(detail_serializer.data)

    def get_permissions(self):
        if self.request.method in ["GET"]:
            return [permissions.AllowAny()]
        return [IsOwnerOrReadOnly()]

    def get_queryset(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # Владельцы могут редактировать свои компании независимо от статуса
            if self.request.user.role == "ROLE_SUPPLIER":
                return Company.objects.filter(owner=self.request.user)
            # Администраторы могут редактировать все компании независимо от статуса
            elif self.request.user.is_staff:
                return Company.objects.all()
        # Для публичного просмотра (GET) показываем только одобренные компании
        return Company.objects.approved()


class MyCompaniesView(generics.ListAPIView):
    serializer_class = CompanyListSerializer
    permission_classes = [IsSupplierOrAdmin]

    def get_queryset(self):
        return Company.objects.filter(owner=self.request.user)


class BranchListCreateView(generics.ListCreateAPIView):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company_id = self.kwargs["company_id"]
        # Показываем филиалы только одобренных компаний
        return Branch.objects.filter(company_id=company_id, company__status="APPROVED")

    def perform_create(self, serializer):
        company_id = self.kwargs["company_id"]
        try:
            company = Company.objects.get(id=company_id, owner=self.request.user)
            serializer.save(company=company)
        except Company.DoesNotExist:
            raise serializers.ValidationError(
                {"error": "Company not found or access denied"}
            )


class CompanyTendersView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from app.tenders.models import Tender
        company_id = self.kwargs["company_id"]
        try:
            # Показываем тендеры только одобренных компаний
            company = Company.objects.approved().get(id=company_id)
            return Tender.objects.filter(author=company.owner, status="APPROVED").order_by("-created_at")
        except Company.DoesNotExist:
            return Tender.objects.none()

    def get_serializer_class(self):
        from app.tenders.serializers import TenderListSerializer
        return TenderListSerializer


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company_id = self.kwargs["company_id"]
        # Показываем сотрудников только одобренных компаний
        return Employee.objects.filter(company_id=company_id, company__status="APPROVED")

    def perform_create(self, serializer):
        company_id = self.kwargs["company_id"]
        try:
            company = Company.objects.get(id=company_id, owner=self.request.user)
            serializer.save(company=company)
        except Company.DoesNotExist:
            raise serializers.ValidationError(
                {"error": "Company not found or access denied"}
            )


@staff_member_required
@require_http_methods(["GET"])
def download_company_import_sample(request):
    """
    Скачивание образца Excel файла для импорта компаний
    Доступен только для сотрудников (staff_member_required)
    """
    from tablib import Dataset
    
    # Создаем ресурс и dataset
    resource = CompanyResource()
    dataset = Dataset()
    
    # Устанавливаем заголовки из ресурса
    headers = ['ID', 'Название', 'Номера телефонов', 'Описание', 'Город', 'Адрес', 
               'Тип поставщика', 'Контакты', 'Юр. информация', 'Способы оплаты', 
               'График работы', 'Статус', 'Владелец', 'Дата создания']
    
    dataset.headers = headers
    
    # Добавляем примеры данных с русскими значениями для удобства
    examples = [
        # Пример 1 - Дилер (с русскими названиями типа и статуса)
        [
            '',  # ID пустой для новой записи
            'ТОО "Строй Альянс"',
            '+7-777-100-20-30;+7-705-200-40-50',
            'Поставка строительных материалов, цемент, арматура, кирпич. Оптовые и розничные продажи.',
            'Алматы',
            'ул. Сейфуллина, 458, офис 12А',
            'Дилер',  # Будет автоматически преобразовано в DEALER
            json.dumps({
                "phone": "+7-777-100-20-30", 
                "email": "sales@stroyalliance.kz", 
                "website": "www.stroyalliance.kz"
            }, ensure_ascii=False),
            json.dumps({
                "inn": "123456789012", 
                "legal_name": "ТОО Строй Альянс", 
                "legal_address": "г.Алматы, ул.Сейфуллина, 458"
            }, ensure_ascii=False),
            json.dumps(["CASH", "CARD", "TRANSFER"], ensure_ascii=False),
            json.dumps({
                "description": "Пн-Пт: 8:00-18:00, Сб: 9:00-15:00"
            }, ensure_ascii=False),
            'Одобрено',  # Будет автоматически преобразовано в APPROVED
            'manager@stroyalliance.kz',
            ''
        ],
        # Пример 2 - Производитель
        [
            '',  # ID пустой для новой записи
            'ТОО "МеталлПром"',
            '+7-727-350-60-70',
            'Производство металлических конструкций и изделий.',
            'Караганда',
            'промзона Восток, участок 15Б',
            'Производитель',  # Будет преобразовано в MANUFACTURER
            json.dumps({
                "phone": "+7-727-350-60-70", 
                "email": "orders@metallprom.kz", 
                "website": "www.metallprom.kz"
            }, ensure_ascii=False),
            json.dumps({
                "inn": "987654321098", 
                "legal_name": "ТОО МеталлПром", 
                "legal_address": "г.Караганда, промзона Восток, участок 15Б"
            }, ensure_ascii=False),
            json.dumps(["TRANSFER", "CASH"], ensure_ascii=False),
            json.dumps({
                "description": "Пн-Сб: 7:00-19:00"
            }, ensure_ascii=False),
            'Одобрено',
            'admin@metallprom.kz',
            ''
        ]
    ]
    
    # Добавляем данные в dataset
    for row_data in examples:
        dataset.append(row_data)
    
    # Генерируем Excel файл
    excel_data = dataset.export('xlsx')
    
    # Создаем HTTP ответ с Excel файлом
    response = HttpResponse(
        excel_data,
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="sample_companies_import.xlsx"'
    
    return response


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def supplier_types_list(request):
    """
    API эндпоинт для получения списка доступных типов поставщиков
    Возвращает список кортежей (код, название) для использования в фильтрах
    """
    supplier_types = [
        {"code": choice[0], "name": choice[1]} 
        for choice in Company.SUPPLIER_TYPE_CHOICES
    ]
    
    return Response({
        "supplier_types": supplier_types
    })
