from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from app.common.permissions import IsAdminOrReadOnly
from .models import Category
from .serializers import CategorySerializer, CategoryTreeSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def category_tree(request):
    root_categories = Category.objects.filter(parent=None, is_active=True)
    serializer = CategoryTreeSerializer(root_categories, many=True)
    return Response(serializer.data)