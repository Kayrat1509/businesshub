from django.contrib import admin
from django import forms
from django.forms import TextInput, Textarea, DateTimeInput, Select, CheckboxInput

from .models import Action, Ad


class AdAdminForm(forms.ModelForm):
    class Meta:
        model = Ad
        fields = '__all__'
        widgets = {
            'title': TextInput(attrs={'size': '60'}),
            'url': TextInput(attrs={'size': '80', 'placeholder': 'https://example.com'}),
            'position': Select(attrs={'style': 'width: 200px;'}),
            'status': Select(attrs={'style': 'width: 150px;'}),
            'starts_at': DateTimeInput(attrs={'type': 'datetime-local'}),
            'is_active': CheckboxInput(),
        }
        help_texts = {
            'title': 'Название рекламного объявления (будет отображаться в центре баннера)',
            'image': 'Загрузите изображение для рекламы любого размера и формата (JPG, PNG, GIF, WEBP и др.)',
            'url': 'Ссылка, на которую будет переходить пользователь при клике на баннер',
            'position': 'Позиция показа рекламы (все рекламы отображаются как полноширинные баннеры на главной странице)',
            'status': 'Статус объявления: активно или остановлено',
            'starts_at': 'Дата и время начала показа рекламы (если не указано, будет установлена текущая дата)',
            'is_active': 'Отметьте для активации рекламы',
        }

    def clean(self):
        # Убираем все валидации для изображения рекламы
        cleaned_data = super().clean()
        
        # Проверяем и исправляем даты
        starts_at = cleaned_data.get('starts_at')
        ends_at = cleaned_data.get('ends_at')
        
        # Если дата начала не указана, устанавливаем текущую дату
        if not starts_at:
            from django.utils import timezone
            cleaned_data['starts_at'] = timezone.now()
        
        # Если дата окончания не указана или раньше даты начала, устанавливаем +30 дней
        if not ends_at or (starts_at and ends_at <= starts_at):
            from django.utils import timezone
            from datetime import timedelta
            start_date = starts_at or timezone.now()
            cleaned_data['ends_at'] = start_date + timedelta(days=30)
        
        return cleaned_data


class ActionAdminForm(forms.ModelForm):
    class Meta:
        model = Action
        fields = '__all__'
        widgets = {
            'title': TextInput(attrs={'size': '60'}),
            'description': Textarea(attrs={'rows': 4, 'cols': 80}),
            'starts_at': DateTimeInput(attrs={'type': 'datetime-local'}),
            'ends_at': DateTimeInput(attrs={'type': 'datetime-local'}),
            'is_active': CheckboxInput(),
        }
        help_texts = {
            'title': 'Название акции',
            'description': 'Подробное описание акции',
            'company': 'Компания, которая проводит акцию',
            'starts_at': 'Дата и время начала акции',
            'ends_at': 'Дата и время окончания акции',
            'is_active': 'Отметьте для активации акции',
        }


def stop_ads(modeladmin, request, queryset):
    """Остановить выбранные объявления"""
    updated = queryset.update(status='stopped')
    modeladmin.message_user(request, f'Остановлено объявлений: {updated}')
stop_ads.short_description = "Остановить объявления"


def resume_ads(modeladmin, request, queryset):
    """Возобновить выбранные объявления"""
    updated = queryset.update(status='active')
    modeladmin.message_user(request, f'Возобновлено объявлений: {updated}')
resume_ads.short_description = "Возобновить объявления"


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    form = AdAdminForm
    list_display = [
        "title",
        "position",
        "status",
        "is_active",
        "is_current",
        "starts_at",
        "ends_at",
    ]
    list_filter = ["position", "status", "is_active", "starts_at", "ends_at"]
    search_fields = ["title", "url"]
    list_editable = ["is_active", "status"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 25
    actions = [stop_ads, resume_ads]
    exclude = ['ends_at']

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("title", "image", "url")},
        ),
        (
            "Настройки показа",
            {"fields": ("position", "status", "is_active")},
        ),
        (
            "Период действия",
            {"fields": ("starts_at",)},
        ),
        (
            "Служебная информация",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def is_current(self, obj):
        return obj.is_current

    is_current.boolean = True
    is_current.short_description = "Активна сейчас"


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    form = ActionAdminForm
    list_display = [
        "title",
        "company",
        "is_active",
        "is_current",
        "starts_at",
        "ends_at",
    ]
    list_filter = ["is_active", "starts_at", "ends_at", "company"]
    search_fields = ["title", "description", "company__name"]
    list_editable = ["is_active"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 25

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("company", "title", "description")},
        ),
        (
            "Настройки показа",
            {"fields": ("is_active",)},
        ),
        (
            "Период действия",
            {"fields": ("starts_at", "ends_at")},
        ),
        (
            "Служебная информация",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def is_current(self, obj):
        return obj.is_current

    is_current.boolean = True
    is_current.short_description = "Активна сейчас"
