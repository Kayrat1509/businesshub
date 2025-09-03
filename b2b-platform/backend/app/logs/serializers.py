from rest_framework import serializers

from .models import ActionLog


class ActionLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = ActionLog
        fields = [
            "id",
            "action",
            "entity_type",
            "entity_id",
            "payload",
            "user_email",
            "user_name",
            "created_at",
        ]
