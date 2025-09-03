# Generated migration for products app

import django.db.models.deletion
from django.db import migrations, models

import app.products.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("categories", "0001_initial"),
        ("companies", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Product",
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
                ("sku", models.CharField(blank=True, max_length=100)),
                ("description", models.TextField()),
                (
                    "price",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                (
                    "currency",
                    models.CharField(
                        choices=[
                            ("RUB", "Russian Ruble"),
                            ("USD", "US Dollar"),
                            ("EUR", "Euro"),
                        ],
                        default="RUB",
                        max_length=3,
                    ),
                ),
                ("is_service", models.BooleanField(default=False)),
                (
                    "images",
                    models.JSONField(default=list, help_text="List of image URLs"),
                ),
                ("in_stock", models.BooleanField(default=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="categories.category",
                    ),
                ),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="products",
                        to="companies.company",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ProductImage",
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
                    "image",
                    models.ImageField(
                        upload_to=app.products.models.product_image_upload_path
                    ),
                ),
                ("alt_text", models.CharField(blank=True, max_length=200)),
                ("is_primary", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="product_images",
                        to="products.product",
                    ),
                ),
            ],
            options={
                "ordering": ["-is_primary", "created_at"],
            },
        ),
    ]
