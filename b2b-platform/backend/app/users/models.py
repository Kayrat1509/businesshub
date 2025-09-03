from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_SEEKER = "ROLE_SEEKER"
    ROLE_SUPPLIER = "ROLE_SUPPLIER"
    ROLE_ADMIN = "ROLE_ADMIN"

    ROLE_CHOICES = [
        (ROLE_SEEKER, "Покупатель"),
        (ROLE_SUPPLIER, "Поставщик"),
        (ROLE_ADMIN, "Администратор"),
    ]

    email = models.EmailField(unique=True, verbose_name="Email")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_SEEKER, verbose_name="Роль")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.email


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites", verbose_name="Пользователь")
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE, verbose_name="Компания")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        unique_together = ["user", "company"]
        verbose_name = "Избранное"
        verbose_name_plural = "Избранные"

    def __str__(self):
        return f"{self.user.email} -> {self.company.name}"


class SearchHistory(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="search_history"
    )
    query = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["user", "query", "category", "location"]

    def __str__(self):
        return f"{self.user.email} - {self.query}"
