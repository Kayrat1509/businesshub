# Generated migration for ads app

import django.db.models.deletion
from django.db import migrations, models

import app.ads.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("companies", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Ad",
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
                (
                    "image",
                    models.ImageField(upload_to=app.ads.models.ad_image_upload_path),
                ),
                ("url", models.URLField()),
                (
                    "position",
                    models.CharField(
                        choices=[
                            ("HOME_WIDGET", "Home Widget"),
                            ("SIDEBAR", "Sidebar"),
                            ("BANNER", "Banner"),
                        ],
                        max_length=20,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Action",
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
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="actions",
                        to="companies.company",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
