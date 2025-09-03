from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from app.common.permissions import IsAdmin
from app.companies.models import Company
from app.companies.serializers import CompanyListSerializer
from app.products.models import Product
from app.products.serializers import ProductListSerializer
from app.reviews.models import Review
from app.reviews.serializers import ReviewModerationSerializer
from app.tenders.models import Tender
from app.tenders.serializers import TenderModerationSerializer


class ModerationFilter(filters.FilterSet):
    status = filters.ChoiceFilter(field_name="status")
    created_at = filters.DateFromToRangeFilter(field_name="created_at")

    class Meta:
        fields = ["status", "created_at"]


class CompanyModerationView(generics.ListAPIView):
    queryset = Company.objects.filter(status="PENDING")
    serializer_class = CompanyListSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ["-created_at"]


class CompanyModerationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanyListSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        company = self.get_object()
        new_status = request.data.get("status")

        if new_status in ["APPROVED", "REJECTED"]:
            company.status = new_status
            company.save()

            serializer = self.get_serializer(company)
            return Response(serializer.data)

        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)


class ReviewModerationView(generics.ListAPIView):
    queryset = Review.objects.filter(status="PENDING")
    serializer_class = ReviewModerationSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ["-created_at"]


class ReviewModerationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewModerationSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        review = self.get_object()
        new_status = request.data.get("status")

        if new_status in ["APPROVED", "REJECTED"]:
            review.status = new_status
            review.save()

            # Update company rating if approved
            if new_status == "APPROVED":
                review.company.update_rating()

            serializer = self.get_serializer(review)
            return Response(serializer.data)

        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)


class TenderModerationView(generics.ListAPIView):
    queryset = Tender.objects.filter(status="PENDING")
    serializer_class = TenderModerationSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ["-created_at"]


class TenderModerationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Tender.objects.all()
    serializer_class = TenderModerationSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        tender = self.get_object()
        new_status = request.data.get("status")

        if new_status in ["APPROVED", "REJECTED"]:
            tender.status = new_status
            tender.save()

            serializer = self.get_serializer(tender)
            return Response(serializer.data)

        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)


class ProductModerationView(generics.ListAPIView):
    queryset = Product.objects.filter(
        is_active=False
    )  # Assuming pending products are marked as inactive
    serializer_class = ProductListSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ["-created_at"]


class ProductModerationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductListSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        product = self.get_object()
        new_status = request.data.get("status")

        if new_status == "APPROVED":
            product.is_active = True
            product.save()
        elif new_status == "REJECTED":
            product.is_active = False
            product.save()

        serializer = self.get_serializer(product)
        return Response(serializer.data)
