from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django_filters import rest_framework as filters

from app.common.permissions import IsOwnerOrReadOnly, IsSupplierOrAdmin
from .models import Company, Branch, Employee
from .serializers import (
    CompanyListSerializer, CompanyDetailSerializer, 
    CompanyCreateUpdateSerializer, BranchSerializer, EmployeeSerializer
)


class CompanyFilter(filters.FilterSet):
    category = filters.CharFilter(field_name='categories__slug')
    city = filters.CharFilter(field_name='city', lookup_expr='icontains')
    rating_gte = filters.NumberFilter(field_name='rating', lookup_expr='gte')
    has_actions = filters.BooleanFilter(method='filter_has_actions')
    is_popular = filters.BooleanFilter(method='filter_is_popular')
    
    class Meta:
        model = Company
        fields = ['category', 'city', 'rating_gte', 'has_actions', 'is_popular', 'status']
    
    def filter_has_actions(self, queryset, name, value):
        if value:
            return queryset.filter(actions__is_active=True).distinct()
        return queryset
    
    def filter_is_popular(self, queryset, name, value):
        if value:
            return queryset.filter(rating__gte=4.0).order_by('-rating')[:10]
        return queryset


class CompanyListCreateView(generics.ListCreateAPIView):
    queryset = Company.objects.filter(status='APPROVED')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CompanyFilter
    search_fields = ['name', 'description', 'city']
    ordering_fields = ['name', 'rating', 'created_at']
    ordering = ['-rating', 'name']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CompanyCreateUpdateSerializer
        return CompanyListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSupplierOrAdmin()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CompanyRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CompanyCreateUpdateSerializer
        return CompanyDetailSerializer
    
    def get_permissions(self):
        if self.request.method in ['GET']:
            return [permissions.AllowAny()]
        return [IsOwnerOrReadOnly()]
    
    def get_queryset(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # Suppliers can only edit their own companies
            if self.request.user.role == 'ROLE_SUPPLIER':
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
        company_id = self.kwargs['company_id']
        return Branch.objects.filter(company_id=company_id)
    
    def perform_create(self, serializer):
        company_id = self.kwargs['company_id']
        try:
            company = Company.objects.get(id=company_id, owner=self.request.user)
            serializer.save(company=company)
        except Company.DoesNotExist:
            return Response(
                {'error': 'Company not found or access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        company_id = self.kwargs['company_id']
        return Employee.objects.filter(company_id=company_id)
    
    def perform_create(self, serializer):
        company_id = self.kwargs['company_id']
        try:
            company = Company.objects.get(id=company_id, owner=self.request.user)
            serializer.save(company=company)
        except Company.DoesNotExist:
            return Response(
                {'error': 'Company not found or access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )