from django.db.models import Q
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, serializers, status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from app.common.permissions import IsOwnerOrReadOnly, IsSupplierOrAdmin

from .models import Branch, Company, Employee
from .serializers import (BranchSerializer, CompanyCreateUpdateSerializer,
                          CompanyDetailSerializer, CompanyListSerializer,
                          EmployeeSerializer)


class CompanyFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="categories__slug")
    city = filters.CharFilter(field_name="city", lookup_expr="icontains")
    rating_gte = filters.NumberFilter(field_name="rating", lookup_expr="gte")
    has_actions = filters.BooleanFilter(method="filter_has_actions")
    status = filters.CharFilter(field_name="status")

    class Meta:
        model = Company
        fields = [
            "category",
            "city",
            "rating_gte",
            "has_actions",
            "status",
        ]

    def filter_has_actions(self, queryset, name, value):
        if value:
            return queryset.filter(actions__is_active=True).distinct()
        return queryset


class CompanyListCreateView(generics.ListCreateAPIView):
    queryset = Company.objects.all()
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
    queryset = Company.objects.all()

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
            # Suppliers can only edit their own companies
            if self.request.user.role == "ROLE_SUPPLIER":
                return Company.objects.filter(owner=self.request.user)
        return Company.objects.all()


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
        return Branch.objects.filter(company_id=company_id)

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
            company = Company.objects.get(id=company_id)
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
        return Employee.objects.filter(company_id=company_id)

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
            company = Company.objects.get(id=company_id)
            return Tender.objects.filter(author=company.owner, status="APPROVED").order_by("-created_at")
        except Company.DoesNotExist:
            return Tender.objects.none()

    def get_serializer_class(self):
        from app.tenders.serializers import TenderListSerializer
        return TenderListSerializer
