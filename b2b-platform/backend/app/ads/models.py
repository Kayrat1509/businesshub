from django.db import models


def ad_image_upload_path(instance, filename):
    return f"ad_images/{filename}"


class Ad(models.Model):
    POSITION_CHOICES = [
        ("HOME_WIDGET", "Баннер на главной странице"),
        ("SIDEBAR_LEFT", "Боковая панель с левой стороны"),
        ("SIDEBAR_RIGHT", "Боковая панель с правой стороны"),
        ("BANNER", "Полноширинный баннер"),
    ]
    
    STATUS_CHOICES = [
        ("active", "Активно"),
        ("stopped", "Остановлено"),
    ]

    title = models.CharField(max_length=200, verbose_name="Название")
    image = models.ImageField(
        upload_to=ad_image_upload_path, 
        verbose_name="Изображение",
        help_text="Загрузите изображение для рекламного баннера (поддерживаются все популярные форматы: JPG, PNG, GIF, WEBP)"
    )
    url = models.URLField(verbose_name="Ссылка")
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, verbose_name="Позиция показа")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="active", 
        verbose_name="Статус"
    )
    starts_at = models.DateTimeField(verbose_name="Начало показа", null=True, blank=True)
    ends_at = models.DateTimeField(verbose_name="Окончание показа", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Рекламное объявление"
        verbose_name_plural = "Рекламные объявления"

    def __str__(self):
        return self.title

    @property
    def is_current(self):
        from django.utils import timezone

        now = timezone.now()
        # Если даты не установлены, считаем рекламу активной если is_active=True
        if not self.starts_at or not self.ends_at:
            return self.is_active
        return self.is_active and self.starts_at <= now <= self.ends_at


class Action(models.Model):
    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="actions"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    # Связь ManyToMany с товарами - акция может содержать много товаров
    products = models.ManyToManyField(
        "products.Product",
        related_name="actions",
        blank=True,
        help_text="Товары, участвующие в данной акции"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.company.name}"

    @property
    def is_current(self):
        from django.utils import timezone

        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at
