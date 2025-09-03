from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.filters import OrderingFilter, SearchFilter

from app.common.permissions import IsAdmin

from .models import ActionLog
from .serializers import ActionLogSerializer


class ActionLogFilter(filters.FilterSet):
    user = filters.NumberFilter(field_name="user__id")
    user_email = filters.CharFilter(field_name="user__email", lookup_expr="icontains")
    entity_type = filters.CharFilter(lookup_expr="icontains")
    action = filters.CharFilter(lookup_expr="icontains")
    date_from = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_to = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = ActionLog
        fields = ["user", "user_email", "entity_type", "action", "date_from", "date_to"]


class ActionLogListView(generics.ListAPIView):
    queryset = ActionLog.objects.all()
    serializer_class = ActionLogSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ActionLogFilter
    search_fields = ["action", "entity_type", "user__email"]
    ordering_fields = ["created_at", "action", "entity_type"]
    ordering = ["-created_at"]
