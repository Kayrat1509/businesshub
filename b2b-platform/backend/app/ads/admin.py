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
            'starts_at': DateTimeInput(attrs={'type': 'datetime-local'}),
            'ends_at': DateTimeInput(attrs={'type': 'datetime-local'}),
            'is_active': CheckboxInput(),
        }
        help_texts = {
            'title': 'Название рекламного объявления (будет отображаться в центре баннера)',
            'image': 'Загрузите изображение для рекламы (будет отображаться как фон в безопасной зоне баннера)',
            'url': 'Ссылка, на которую будет переходить пользователь при клике на баннер',
            'position': 'Позиция показа рекламы (все рекламы отображаются как полноширинные баннеры на главной странице)',
            'starts_at': 'Дата и время начала показа рекламы',
            'ends_at': 'Дата и время окончания показа рекламы',
            'is_active': 'Отметьте для активации рекламы',
        }


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


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    form = AdAdminForm
    list_display = [
        "title",
        "position",
        "is_active",
        "is_current",
        "starts_at",
        "ends_at",
    ]
    list_filter = ["position", "is_active", "starts_at", "ends_at"]
    search_fields = ["title", "url"]
    list_editable = ["is_active"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 25

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("title", "image", "url")},
        ),
        (
            "Настройки показа",
            {"fields": ("position", "is_active")},
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
