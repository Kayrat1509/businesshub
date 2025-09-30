from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from app.common.permissions import IsAdmin

from .models import Tender
from .serializers import (TenderCreateUpdateSerializer, TenderDetailSerializer,
                          TenderListSerializer, TenderModerationSerializer)


class TenderFilter(filters.FilterSet):
    company = filters.NumberFilter(field_name="company__id")
    category = filters.CharFilter(field_name="categories__slug")
    city = filters.CharFilter(field_name="city", lookup_expr="icontains")
    budget_min = filters.NumberFilter(field_name="budget_max", lookup_expr="gte")
    budget_max = filters.NumberFilter(field_name="budget_min", lookup_expr="lte")
    status = filters.CharFilter(field_name="status")

    class Meta:
        model = Tender
        fields = ["company", "category", "city", "budget_min", "budget_max", "status"]


class TenderListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TenderFilter
    search_fields = ["title", "description", "city"]
    ordering_fields = ["title", "deadline_date", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if (
            self.request.user.is_authenticated
            and self.request.user.role == "ROLE_ADMIN"
        ):
            return Tender.objects.all()
        return Tender.objects.filter(status="APPROVED")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TenderCreateUpdateSerializer
        return TenderListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        """
        Автоматическое присваивание компании при создании тендера.
        Компания определяется через Company.objects.get(owner=request.user)
        """
        try:
            from app.companies.models import Company
            
            # Суперпользователи могут создавать тендеры для любой компании
            if self.request.user.is_superuser:
                # Если company_id передан в запросе, используем его
                company_id = self.request.data.get('company_id')
                if company_id:
                    try:
                        company = Company.objects.get(id=company_id)
                        serializer.save(author=self.request.user, company=company)
                        return
                    except Company.DoesNotExist:
                        pass
            
            # Для обычных пользователей получаем компанию автоматически
            user_company = Company.objects.get(owner=self.request.user)
            serializer.save(author=self.request.user, company=user_company)
            
        except Company.DoesNotExist:
            # Если у пользователя нет компании, возвращаем ошибку
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"error": "У вас нет компании для создания тендеров"}
            )


class TenderRetrieveUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tender.objects.all()

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return TenderCreateUpdateSerializer
        return TenderDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # Users can edit and delete all their own tenders regardless of status
            return Tender.objects.filter(author=self.request.user)
        return Tender.objects.all()


class TenderModerationView(generics.ListAPIView):
    queryset = Tender.objects.filter(status="PENDING")
    serializer_class = TenderModerationSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TenderFilter
    ordering = ["-created_at"]


class TenderModerationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Tender.objects.all()
    serializer_class = TenderModerationSerializer
    permission_classes = [IsAdmin]


class MyTendersView(generics.ListAPIView):
    serializer_class = TenderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TenderFilter
    ordering = ["-created_at"]

    def get_queryset(self):
        # Фильтруем тендеры по компании пользователя
        try:
            from app.companies.models import Company
            user_company = Company.objects.get(owner=self.request.user)
            return Tender.objects.filter(company=user_company)
        except Company.DoesNotExist:
            # Если у пользователя нет компании, возвращаем пустой queryset
            return Tender.objects.none()
