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
    category = filters.CharFilter(field_name="categories__slug")
    city = filters.CharFilter(field_name="city", lookup_expr="icontains")
    budget_min = filters.NumberFilter(field_name="budget_max", lookup_expr="gte")
    budget_max = filters.NumberFilter(field_name="budget_min", lookup_expr="lte")
    status = filters.CharFilter(field_name="status")

    class Meta:
        model = Tender
        fields = ["category", "city", "budget_min", "budget_max", "status"]


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
        serializer.save(author=self.request.user)


class TenderRetrieveUpdateView(generics.RetrieveUpdateAPIView):
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
        if self.request.method in ["PUT", "PATCH"]:
            # Users can only edit their own tenders and only if pending
            return Tender.objects.filter(author=self.request.user, status="PENDING")
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
        return Tender.objects.filter(author=self.request.user)
