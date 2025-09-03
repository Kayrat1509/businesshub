# Generated migration for tenders app

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import app.tenders.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("categories", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Tender",
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
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField()),
                (
                    "attachments",
                    models.JSONField(
                        default=list, help_text="List of attachment file URLs"
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("APPROVED", "Approved"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                ("city", models.CharField(max_length=100)),
                (
                    "budget_min",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                (
                    "budget_max",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("deadline_date", models.DateField(blank=True, null=True)),
                (
                    "admin_comment",
                    models.TextField(
                        blank=True, help_text="Admin comment for rejection"
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tenders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "categories",
                    models.ManyToManyField(blank=True, to="categories.category"),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="TenderAttachment",
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
                    "file",
                    models.FileField(
                        upload_to=app.tenders.models.tender_attachment_upload_path
                    ),
                ),
                ("filename", models.CharField(max_length=255)),
                ("file_size", models.PositiveIntegerField()),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tender_attachments",
                        to="tenders.tender",
                    ),
                ),
            ],
        ),
    ]
