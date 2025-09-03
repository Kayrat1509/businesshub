# Generated migration for companies app

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import app.companies.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("categories", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Company",
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
                ("name", models.CharField(max_length=200)),
                (
                    "logo",
                    models.ImageField(
                        blank=True,
                        null=True,
                        upload_to=app.companies.models.logo_upload_path,
                        validators=[app.companies.models.validate_logo_size],
                    ),
                ),
                ("description", models.TextField()),
                (
                    "contacts",
                    models.JSONField(
                        default=dict, help_text="Phone numbers, emails, websites"
                    ),
                ),
                (
                    "legal_info",
                    models.JSONField(
                        default=dict, help_text="Legal information, INN, KPP, etc."
                    ),
                ),
                (
                    "payment_methods",
                    models.JSONField(
                        default=list, help_text="Available payment methods"
                    ),
                ),
                (
                    "work_schedule",
                    models.JSONField(default=dict, help_text="Working hours schedule"),
                ),
                ("staff_count", models.PositiveIntegerField(default=0)),
                ("branches_count", models.PositiveIntegerField(default=1)),
                ("latitude", models.FloatField(blank=True, null=True)),
                ("longitude", models.FloatField(blank=True, null=True)),
                ("city", models.CharField(max_length=100)),
                ("address", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("PENDING", "Pending"),
                            ("APPROVED", "Approved"),
                            ("BANNED", "Banned"),
                        ],
                        default="DRAFT",
                        max_length=20,
                    ),
                ),
                ("rating", models.FloatField(default=0.0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "categories",
                    models.ManyToManyField(blank=True, to="categories.category"),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="companies",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "companies",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Employee",
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
                ("full_name", models.CharField(max_length=200)),
                ("position", models.CharField(max_length=100)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="employees",
                        to="companies.company",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Branch",
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
                ("address", models.CharField(max_length=255)),
                ("latitude", models.FloatField()),
                ("longitude", models.FloatField()),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="branches",
                        to="companies.company",
                    ),
                ),
            ],
        ),
    ]
