from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReviewListCreateView.as_view(), name='review-list-create'),
    path('my/', views.MyReviewsView.as_view(), name='my-reviews'),
    path('moderation/', views.ReviewModerationView.as_view(), name='review-moderation'),
    path('moderation/<int:pk>/', views.ReviewModerationDetailView.as_view(), name='review-moderation-detail'),
]