# Generated migration for logs app

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ActionLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "action",
                    models.CharField(help_text="Action description", max_length=200),
                ),
                (
                    "entity_type",
                    models.CharField(
                        help_text="Type of entity affected", max_length=50
                    ),
                ),
                (
                    "entity_id",
                    models.PositiveIntegerField(
                        blank=True, help_text="ID of affected entity", null=True
                    ),
                ),
                (
                    "payload",
                    models.JSONField(default=dict, help_text="Additional action data"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="action_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["user", "created_at"],
                        name="logs_actionlog_user_id_created_at_idx",
                    ),
                    models.Index(
                        fields=["entity_type", "created_at"],
                        name="logs_actionlog_entity_type_created_at_idx",
                    ),
                    models.Index(
                        fields=["created_at"], name="logs_actionlog_created_at_idx"
                    ),
                ],
            },
        ),
    ]
