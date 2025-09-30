from django.utils import timezone
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from app.common.permissions import IsAdmin

from .models import Action, Ad
from .serializers import (ActionCreateUpdateSerializer, ActionSerializer,
                          AdSerializer)


class AdFilter(filters.FilterSet):
    position = filters.CharFilter(field_name="position")
    is_active = filters.BooleanFilter()
    is_current = filters.BooleanFilter(method="filter_is_current")

    class Meta:
        model = Ad
        fields = ["position", "is_active", "is_current"]

    def filter_is_current(self, queryset, name, value):
        # ===== ИСПРАВЛЕНО: ФИЛЬТР is_current ТЕПЕРЬ УЧИТЫВАЕТ БАННЕРЫ БЕЗ КОНЕЧНОЙ ДАТЫ =====
        # Проблема была в том, что ends_at__gte=now исключал баннеры с ends_at=None
        now = timezone.now()
        if value:
            from django.db.models import Q
            return queryset.filter(
                is_active=True,
                starts_at__lte=now
            ).filter(
                # Баннер актуален если ends_at=None ИЛИ ends_at >= now
                Q(ends_at__isnull=True) | Q(ends_at__gte=now)
            )
        return queryset


class AdListCreateView(generics.ListCreateAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = AdFilter
    ordering_fields = ["title", "starts_at", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [permissions.AllowAny()]


class AdRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [IsAdmin]


class ActionFilter(filters.FilterSet):
    company = filters.NumberFilter(field_name="company__id")
    is_active = filters.BooleanFilter()
    is_current = filters.BooleanFilter(method="filter_is_current")

    class Meta:
        model = Action
        fields = ["company", "is_active", "is_current"]

    def filter_is_current(self, queryset, name, value):
        now = timezone.now()
        if value:
            return queryset.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)
        return queryset


class ActionListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ActionFilter
    ordering_fields = ["title", "starts_at", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.method == "POST" or (
            self.request.user.is_authenticated
            and self.request.user.role in ["ROLE_SUPPLIER", "ROLE_ADMIN"]
        ):
            return Action.objects.all()

        # Public view - only show current actions
        now = timezone.now()
        return Action.objects.filter(
            is_active=True,
            starts_at__lte=now,
            ends_at__gte=now,
            company__status="APPROVED",
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ActionCreateUpdateSerializer
        return ActionSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        # Get the user's company (не обязательно одобренная)
        user_company = self.request.user.companies.first()
        if user_company:
            serializer.save(company=user_company)
        else:
            # Если нет компании, показываем ошибку
            from rest_framework.exceptions import ValidationError
            raise ValidationError("У вас нет компании для создания акций")


class ActionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):

    def get_queryset(self):
        if self.request.method == "GET":
            return Action.objects.all()
        # For modifications, only allow company owners or admins
        if self.request.user.role == "ROLE_ADMIN":
            return Action.objects.all()
        return Action.objects.filter(company__owner=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ActionCreateUpdateSerializer
        return ActionSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class MyActionsView(generics.ListAPIView):
    serializer_class = ActionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ActionFilter
    ordering = ["-created_at"]

    def get_queryset(self):
        return Action.objects.filter(company__owner=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_products_to_action(request, action_id):
    """
    Добавить товары в акцию.
    POST /ads/actions/{action_id}/add-products/
    Body: {"product_ids": [1, 2, 3]}
    """
    try:
        # Получаем акцию, проверяем что она принадлежит пользователю
        action = Action.objects.filter(
            id=action_id,
            company__owner=request.user
        ).first()

        if not action:
            return Response(
                {"error": "Акция не найдена или не принадлежит вам"},
                status=status.HTTP_404_NOT_FOUND
            )

        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response(
                {"error": "Не указаны ID товаров"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Получаем товары пользователя
        from app.products.models import Product
        products = Product.objects.filter(
            id__in=product_ids,
            company__owner=request.user
        )

        if not products.exists():
            return Response(
                {"error": "Товары не найдены или не принадлежат вам"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Добавляем товары в акцию и обновляем флаг on_sale
        added_count = 0
        for product in products:
            if product not in action.products.all():
                action.products.add(product)
                product.on_sale = True
                product.save()
                added_count += 1

        return Response({
            "success": True,
            "message": f"Добавлено {added_count} товаров в акцию",
            "action_id": action.id,
            "total_products": action.products.count()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_products_from_action(request, action_id):
    """
    Удалить товары из акции.
    POST /ads/actions/{action_id}/remove-products/
    Body: {"product_ids": [1, 2, 3]}
    """
    try:
        # Получаем акцию, проверяем что она принадлежит пользователю
        action = Action.objects.filter(
            id=action_id,
            company__owner=request.user
        ).first()

        if not action:
            return Response(
                {"error": "Акция не найдена или не принадлежит вам"},
                status=status.HTTP_404_NOT_FOUND
            )

        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response(
                {"error": "Не указаны ID товаров"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Получаем товары
        from app.products.models import Product
        products = Product.objects.filter(
            id__in=product_ids,
            company__owner=request.user
        )

        if not products.exists():
            return Response(
                {"error": "Товары не найдены"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Удаляем товары из акции и обновляем флаг on_sale если товар не в других акциях
        removed_count = 0
        for product in products:
            if product in action.products.all():
                action.products.remove(product)
                removed_count += 1

                # Проверяем, есть ли товар в других акциях
                if not product.actions.exists():
                    product.on_sale = False
                    product.save()

        return Response({
            "success": True,
            "message": f"Удалено {removed_count} товаров из акции",
            "action_id": action.id,
            "total_products": action.products.count()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_action_products(request, action_id):
    """
    Получить список товаров в акции.
    GET /ads/actions/{action_id}/products/
    """
    try:
        # Получаем акцию
        action = Action.objects.filter(id=action_id).first()

        if not action:
            return Response(
                {"error": "Акция не найдена"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Получаем товары акции
        from app.products.serializers import ProductListSerializer
        products = action.products.all()
        serializer = ProductListSerializer(products, many=True, context={'request': request})

        return Response({
            "success": True,
            "action_id": action.id,
            "action_title": action.title,
            "products_count": products.count(),
            "products": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
