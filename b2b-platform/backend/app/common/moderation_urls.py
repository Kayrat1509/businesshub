from django.urls import path

from .moderation_views import (CompanyModerationDetailView,
                               CompanyModerationView,
                               ProductModerationDetailView,
                               ProductModerationView,
                               ReviewModerationDetailView,
                               ReviewModerationView,
                               TenderModerationDetailView,
                               TenderModerationView)

urlpatterns = [
    # Company moderation
    path("company/", CompanyModerationView.as_view(), name="company-moderation-list"),
    path(
        "company/<int:pk>/",
        CompanyModerationDetailView.as_view(),
        name="company-moderation-detail",
    ),
    path(
        "company/<int:pk>/approve/",
        CompanyModerationDetailView.as_view(),
        name="company-moderation-approve",
    ),
    path(
        "company/<int:pk>/reject/",
        CompanyModerationDetailView.as_view(),
        name="company-moderation-reject",
    ),
    # Review moderation
    path("review/", ReviewModerationView.as_view(), name="review-moderation-list"),
    path(
        "review/<int:pk>/",
        ReviewModerationDetailView.as_view(),
        name="review-moderation-detail",
    ),
    path(
        "review/<int:pk>/approve/",
        ReviewModerationDetailView.as_view(),
        name="review-moderation-approve",
    ),
    path(
        "review/<int:pk>/reject/",
        ReviewModerationDetailView.as_view(),
        name="review-moderation-reject",
    ),
    # Tender moderation
    path("tender/", TenderModerationView.as_view(), name="tender-moderation-list"),
    path(
        "tender/<int:pk>/",
        TenderModerationDetailView.as_view(),
        name="tender-moderation-detail",
    ),
    path(
        "tender/<int:pk>/approve/",
        TenderModerationDetailView.as_view(),
        name="tender-moderation-approve",
    ),
    path(
        "tender/<int:pk>/reject/",
        TenderModerationDetailView.as_view(),
        name="tender-moderation-reject",
    ),
    # Product moderation
    path("product/", ProductModerationView.as_view(), name="product-moderation-list"),
    path(
        "product/<int:pk>/",
        ProductModerationDetailView.as_view(),
        name="product-moderation-detail",
    ),
    path(
        "product/<int:pk>/approve/",
        ProductModerationDetailView.as_view(),
        name="product-moderation-approve",
    ),
    path(
        "product/<int:pk>/reject/",
        ProductModerationDetailView.as_view(),
        name="product-moderation-reject",
    ),
]
