from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


def tender_attachment_upload_path(instance, filename):
    return f"tender_attachments/{instance.id}/{filename}"


class Tender(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "На модерации"),
        (STATUS_APPROVED, "Одобрен"),
        (STATUS_REJECTED, "Отклонен"),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenders", verbose_name="Автор")
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE, related_name="tenders", verbose_name="Компания", null=True, blank=True)
    title = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(verbose_name="Описание")
    attachments = models.JSONField(
        default=list, help_text="Список ссылок на файлы вложений", verbose_name="Вложения"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name="Статус"
    )
    categories = models.ManyToManyField("categories.Category", blank=True, verbose_name="Категории")
    city = models.CharField(max_length=100, verbose_name="Город")
    budget_min = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Минимальный бюджет"
    )
    budget_max = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Максимальный бюджет"
    )
    deadline_date = models.DateField(null=True, blank=True, verbose_name="Крайний срок")
    admin_comment = models.TextField(
        blank=True, help_text="Комментарий администратора при отклонении", verbose_name="Комментарий администратора"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Тендер"
        verbose_name_plural = "Тендеры"

    def __str__(self):
        return self.title


class TenderAttachment(models.Model):
    tender = models.ForeignKey(
        Tender, on_delete=models.CASCADE, related_name="tender_attachments", verbose_name="Тендер"
    )
    file = models.FileField(upload_to=tender_attachment_upload_path, verbose_name="Файл")
    filename = models.CharField(max_length=255, verbose_name="Название файла")
    file_size = models.PositiveIntegerField(verbose_name="Размер файла")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")

    class Meta:
        verbose_name = "Вложение тендера"
        verbose_name_plural = "Вложения тендеров"

    def __str__(self):
        return f"Вложение для {self.tender.title}"
