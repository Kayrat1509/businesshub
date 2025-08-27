from django.urls import path
from . import views

urlpatterns = [
    path('', views.TenderListCreateView.as_view(), name='tender-list-create'),
    path('my/', views.MyTendersView.as_view(), name='my-tenders'),
    path('moderation/', views.TenderModerationView.as_view(), name='tender-moderation'),
    path('moderation/<int:pk>/', views.TenderModerationDetailView.as_view(), name='tender-moderation-detail'),
    path('<int:pk>/', views.TenderRetrieveUpdateView.as_view(), name='tender-detail'),
]