from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django_filters import rest_framework as filters
from django.utils import timezone

from app.common.permissions import IsAdmin
from .models import Ad, Action
from .serializers import AdSerializer, ActionSerializer, ActionCreateUpdateSerializer


class AdFilter(filters.FilterSet):
    position = filters.ChoiceFilter(choices=Ad.POSITION_CHOICES)
    is_active = filters.BooleanFilter()
    is_current = filters.BooleanFilter(method='filter_is_current')
    
    class Meta:
        model = Ad
        fields = ['position', 'is_active', 'is_current']
    
    def filter_is_current(self, queryset, name, value):
        now = timezone.now()
        if value:
            return queryset.filter(
                is_active=True,
                starts_at__lte=now,
                ends_at__gte=now
            )
        return queryset


class AdListCreateView(generics.ListCreateAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = AdFilter
    ordering_fields = ['title', 'starts_at', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.AllowAny()]


class AdRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [IsAdmin]


class ActionFilter(filters.FilterSet):
    company = filters.NumberFilter(field_name='company__id')
    is_active = filters.BooleanFilter()
    is_current = filters.BooleanFilter(method='filter_is_current')
    
    class Meta:
        model = Action
        fields = ['company', 'is_active', 'is_current']
    
    def filter_is_current(self, queryset, name, value):
        now = timezone.now()
        if value:
            return queryset.filter(
                is_active=True,
                starts_at__lte=now,
                ends_at__gte=now
            )
        return queryset


class ActionListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ActionFilter
    ordering_fields = ['title', 'starts_at', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.method == 'POST' or (
            self.request.user.is_authenticated and 
            self.request.user.role in ['ROLE_SUPPLIER', 'ROLE_ADMIN']
        ):
            return Action.objects.all()
        
        # Public view - only show current actions
        now = timezone.now()
        return Action.objects.filter(
            is_active=True,
            starts_at__lte=now,
            ends_at__gte=now,
            company__status='APPROVED'
        )
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ActionCreateUpdateSerializer
        return ActionSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # Get the user's company
        user_company = self.request.user.companies.filter(status='APPROVED').first()
        if user_company:
            serializer.save(company=user_company)


class ActionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    
    def get_queryset(self):
        if self.request.method == 'GET':
            return Action.objects.all()
        # For modifications, only allow company owners or admins
        if self.request.user.role == 'ROLE_ADMIN':
            return Action.objects.all()
        return Action.objects.filter(company__owner=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ActionCreateUpdateSerializer
        return ActionSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class MyActionsView(generics.ListAPIView):
    serializer_class = ActionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ActionFilter
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Action.objects.filter(company__owner=self.request.user)