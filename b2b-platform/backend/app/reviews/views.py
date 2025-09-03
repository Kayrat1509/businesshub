from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from app.common.permissions import IsAdmin

from .models import Review
from .serializers import (ReviewCreateSerializer, ReviewModerationSerializer,
                          ReviewSerializer)


class ReviewFilter(filters.FilterSet):
    company = filters.NumberFilter(field_name="company__id")
    status = filters.ChoiceFilter(choices=Review.STATUS_CHOICES)
    rating = filters.NumberFilter()
    rating_gte = filters.NumberFilter(field_name="rating", lookup_expr="gte")
    rating_lte = filters.NumberFilter(field_name="rating", lookup_expr="lte")

    class Meta:
        model = Review
        fields = ["company", "status", "rating", "rating_gte", "rating_lte"]


class ReviewListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReviewFilter
    ordering_fields = ["rating", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if (
            self.request.user.is_authenticated
            and self.request.user.role == "ROLE_ADMIN"
        ):
            return Review.objects.all()
        return Review.objects.filter(status="APPROVED")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        # Check if user already reviewed this company
        company_id = request.data.get("company")
        existing_review = Review.objects.filter(
            author=request.user, company_id=company_id
        ).first()

        if existing_review:
            return Response(
                {"error": "You have already reviewed this company"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().create(request, *args, **kwargs)


class ReviewModerationView(generics.ListAPIView):
    queryset = Review.objects.filter(status="PENDING")
    serializer_class = ReviewModerationSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReviewFilter
    ordering = ["-created_at"]


class ReviewModerationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewModerationSerializer
    permission_classes = [IsAdmin]

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        # Update company rating after moderation
        review = self.get_object()
        review.company.update_rating()
        return response


class MyReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(author=self.request.user)
