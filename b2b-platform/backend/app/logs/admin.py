from django.contrib import admin

from .models import ActionLog


@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    list_display = ["user", "action", "entity_type", "entity_id", "created_at"]
    list_filter = ["entity_type", "created_at", "user__role"]
    search_fields = ["user__email", "action", "entity_type"]
    readonly_fields = [
        "user",
        "action",
        "entity_type",
        "entity_id",
        "payload",
        "created_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
