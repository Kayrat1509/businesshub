from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('my/', views.MyProductsView.as_view(), name='my-products'),
    path('<int:pk>/', views.ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),
]