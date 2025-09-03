from django.contrib import admin
from django import forms
from django.forms import TextInput, Textarea, NumberInput, Select, CheckboxInput

from .models import Product, ProductImage


class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'
        widgets = {
            'title': TextInput(attrs={'size': '60'}),
            'sku': TextInput(attrs={'size': '30', 'placeholder': 'Артикул товара'}),
            'description': Textarea(attrs={'rows': 4, 'cols': 80}),
            'price': NumberInput(attrs={'min': '0', 'step': '0.01'}),
            'currency': Select(attrs={'style': 'width: 120px;'}),
            'is_service': CheckboxInput(),
            'in_stock': CheckboxInput(),
            'is_active': CheckboxInput(),
        }
        help_texts = {
            'title': 'Введите название товара или услуги',
            'sku': 'Уникальный артикул товара (опционально)',
            'description': 'Подробное описание товара или услуги',
            'price': 'Цена за единицу товара/услуги (оставьте пустым, если цена договорная)',
            'currency': 'Валюта цены',
            'is_service': 'Отметьте, если это услуга (а не товар)',
            'in_stock': 'Отметьте, если товар есть в наличии',
            'is_active': 'Отметьте для публикации товара на сайте',
            'company': 'Выберите компанию-поставщика',
            'category': 'Выберите категорию товара',
        }


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = [
        "title",
        "company",
        "category", 
        "get_price_display",
        "is_service",
        "in_stock",
        "is_active",
        "created_at"
    ]
    list_filter = [
        "is_service",
        "currency", 
        "in_stock",
        "is_active",
        "category",
        "company",
        "created_at",
    ]
    search_fields = ["title", "description", "sku", "company__name"]
    list_editable = ["in_stock", "is_active"]
    list_per_page = 25

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("company", "title", "sku", "description", "category")},
        ),
        (
            "Цена и наличие",
            {"fields": ("price", "currency", "is_service", "in_stock")},
        ),
        ("Настройки публикации", {"fields": ("is_active",)}),
    )
    
    def get_price_display(self, obj):
        if obj.price:
            return f"{obj.price} {obj.currency}"
        return "Договорная"
    get_price_display.short_description = "Цена"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ["product", "alt_text", "is_primary", "created_at"]
    list_filter = ["is_primary", "created_at"]
    search_fields = ["product__title", "alt_text"]
