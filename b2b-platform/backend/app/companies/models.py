import os

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from PIL import Image

User = get_user_model()


class CompanyQuerySet(models.QuerySet):
    """
    Кастомный QuerySet для модели Company
    Содержит методы для фильтрации компаний по статусу
    """
    
    def approved(self):
        """Возвращает только одобренные компании"""
        return self.filter(status="APPROVED")
    
    def pending(self):
        """Возвращает компании на модерации"""
        return self.filter(status="PENDING")
    
    def draft(self):
        """Возвращает черновики"""
        return self.filter(status="DRAFT")
    
    def banned(self):
        """Возвращает заблокированные компании"""
        return self.filter(status="BANNED")


class CompanyManager(models.Manager):
    """
    Кастомный менеджер для модели Company
    Предоставляет удобные методы для работы с разными статусами
    """
    
    def get_queryset(self):
        """Возвращает кастомный QuerySet"""
        return CompanyQuerySet(self.model, using=self._db)
    
    def approved(self):
        """Возвращает только одобренные компании для публичного API"""
        return self.get_queryset().approved()
    
    def pending(self):
        """Возвращает компании на модерации"""
        return self.get_queryset().pending()
    
    def draft(self):
        """Возвращает черновики"""
        return self.get_queryset().draft()
    
    def banned(self):
        """Возвращает заблокированные компании"""
        return self.get_queryset().banned()


def validate_logo_size(image):
    if image:
        img = Image.open(image)
        width, height = img.size
        if width != 600 or height != 600:
            raise ValidationError("Logo must be exactly 600x600 pixels")


def logo_upload_path(instance, filename):
    return f"company_logos/{instance.id}/{filename}"


class Company(models.Model):
    STATUS_DRAFT = "DRAFT"
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_BANNED = "BANNED"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Черновик"),
        (STATUS_PENDING, "На модерации"),
        (STATUS_APPROVED, "Одобрено"),
        (STATUS_BANNED, "Заблокировано"),
    ]

    PAYMENT_CHOICES = [
        ("CASH", "Наличные"),
        ("CARD", "Банковская карта"),
        ("TRANSFER", "Банковский перевод"),
        ("CRYPTO", "Криптовалюта"),
    ]

    SUPPLIER_TYPE_CHOICES = [
        ("DEALER", "Дилер"),
        ("MANUFACTURER", "Производитель"), 
        ("TRADE_REPRESENTATIVE", "Торговый представитель"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="companies", verbose_name="Владелец")
    name = models.CharField(max_length=200, verbose_name="Название")
    phones = models.CharField(max_length=500, blank=True, verbose_name="Номера телефонов", help_text="Номера телефонов через ; для импорта/экспорта")
    supplier_type = models.CharField(
        max_length=30, 
        choices=SUPPLIER_TYPE_CHOICES, 
        blank=True, 
        verbose_name="Тип поставщика"
    )
    logo = models.ImageField(
        upload_to=logo_upload_path,
        blank=True,
        null=True,
        validators=[validate_logo_size],
        verbose_name="Логотип",
    )
    description = models.TextField(verbose_name="Описание")
    categories = models.ManyToManyField("categories.Category", blank=True, verbose_name="Категории")

    # Contact info stored as JSON
    contacts = models.JSONField(
        default=dict, help_text="Номера телефонов, emails, веб-сайты", verbose_name="Контакты"
    )
    legal_info = models.JSONField(
        default=dict, help_text="Юридическая информация, ИНН, КПП и т.д.", verbose_name="Юридическая информация"
    )
    payment_methods = models.JSONField(
        default=list, help_text="Доступные способы оплаты", verbose_name="Способы оплаты"
    )
    work_schedule = models.JSONField(default=dict, help_text="График работы", verbose_name="График работы")

    # Company details
    staff_count = models.PositiveIntegerField(default=0, verbose_name="Количество сотрудников")
    branches_count = models.PositiveIntegerField(default=1, verbose_name="Количество филиалов")

    # Location
    latitude = models.FloatField(null=True, blank=True, verbose_name="Широта")
    longitude = models.FloatField(null=True, blank=True, verbose_name="Долгота")
    country = models.CharField(max_length=100, default="Казахстан", verbose_name="Страна")
    city = models.CharField(max_length=100, verbose_name="Город")
    address = models.TextField(verbose_name="Адрес")

    # Status and rating
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_APPROVED, verbose_name="Статус"
    )
    rating = models.FloatField(default=0.0, verbose_name="Рейтинг")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    # Кастомный менеджер для работы с статусами
    objects = CompanyManager()

    class Meta:
        verbose_name = "Компания"
        verbose_name_plural = "Компании"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


    def update_rating(self):
        reviews = self.reviews.filter(status="APPROVED")
        if reviews.exists():
            self.rating = reviews.aggregate(models.Avg("rating"))["rating__avg"]
            self.save()


class Branch(models.Model):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="branches"
    )
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company.name} - {self.address}"


class Employee(models.Model):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="employees"
    )
    full_name = models.CharField(max_length=200)
    position = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.company.name}"
