from django.contrib import admin
from django import forms
from django.forms import TextInput, Textarea, NumberInput, Select, CheckboxInput
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin

from .models import Product, ProductImage
from .forms import ProductAdminForm
from .resources import ProductResource




@admin.register(Product)
class ProductAdmin(ImportExportModelAdmin):
    # Подключаем ресурс для импорта/экспорта
    resource_class = ProductResource
    form = ProductAdminForm
    
    # Ограничиваем форматы импорта/экспорта только Excel (.xlsx)
    from import_export.formats.base_formats import XLSX
    formats = [XLSX]
    list_display = [
        "title",
        "company",
        "category", 
        "get_price_display",
        "get_price_conversions",
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
    
    def get_user_company(self, request):
        """Получить компанию текущего пользователя"""
        try:
            from app.companies.models import Company
            return Company.objects.get(owner=request.user)
        except Company.DoesNotExist:
            return None
    
    def get_queryset(self, request):
        """Фильтрация продуктов по компании пользователя"""
        queryset = super().get_queryset(request)
        
        # Суперпользователи видят все продукты
        if request.user.is_superuser:
            return queryset
        
        # Обычные пользователи видят только продукты своей компании
        user_company = self.get_user_company(request)
        if user_company:
            return queryset.filter(company=user_company)
        
        # Если у пользователя нет компании, показываем пустой список
        return queryset.none()
    
    def save_model(self, request, obj, form, change):
        """Привязка продукта к компании при сохранении"""
        # Суперпользователи могут сохранять с любой компанией
        if request.user.is_superuser:
            super().save_model(request, obj, form, change)
            return
        
        # Для обычных пользователей при создании нового продукта
        # обязательно привязываем к их компании
        if not change:  # Новый продукт
            user_company = self.get_user_company(request)
            if user_company:
                obj.company = user_company
            else:
                # Если у пользователя нет компании, не даем создать продукт
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied("У вас нет компании для создания продуктов")
        
        super().save_model(request, obj, form, change)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Ограничение выбора компании и настройка категорий в форме"""
        if db_field.name == "company":
            if request.user.is_superuser:
                # Суперпользователи видят все компании
                pass  # Оставляем queryset без изменений
            else:
                # Обычные пользователи видят только свою компанию
                user_company = self.get_user_company(request)
                if user_company:
                    from app.companies.models import Company
                    kwargs["queryset"] = Company.objects.filter(id=user_company.id)
                else:
                    # Если нет компании, показываем пустой список
                    kwargs["queryset"] = db_field.related_model.objects.none()
        
        elif db_field.name == "category":
            # Настраиваем категории с автоматическим добавлением "Другое"
            self._ensure_other_categories()
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def _ensure_other_categories(self):
        """Автоматически добавляет 'Другое' в каждую группу категорий, если его нет"""
        from app.categories.models import Category
        
        # Получаем все родительские категории (верхний уровень)
        parent_categories = Category.objects.filter(parent__isnull=True, is_active=True)
        
        for parent in parent_categories:
            # Проверяем, есть ли уже "Другое" среди дочерних категорий
            has_other = parent.children.filter(name="Другое", is_active=True).exists()
            
            if not has_other:
                # Создаем "Другое" для этой родительской категории
                Category.objects.get_or_create(
                    name="Другое",
                    parent=parent,
                    defaults={
                        'is_active': True,
                        'slug': f'other-{parent.slug}' if parent.slug else f'other-{parent.id}'
                    }
                )
            
            # Проверяем дочерние категории, которые сами являются родительскими
            child_categories = parent.children.filter(is_active=True)
            for child in child_categories:
                # Если у дочерней категории есть свои дочерние элементы
                if child.children.exists():
                    child_has_other = child.children.filter(name="Другое", is_active=True).exists()
                    
                    if not child_has_other:
                        # Создаем "Другое" для этой дочерней категории
                        Category.objects.get_or_create(
                            name="Другое",
                            parent=child,
                            defaults={
                                'is_active': True,
                                'slug': f'other-{child.slug}' if child.slug else f'other-{child.id}'
                            }
                        )
    
    def has_change_permission(self, request, obj=None):
        """Проверка права на изменение продукта"""
        # Сначала проверяем базовые права
        if not super().has_change_permission(request, obj):
            return False
        
        # Суперпользователи могут менять любые продукты
        if request.user.is_superuser:
            return True
        
        # Для конкретного объекта проверяем принадлежность компании
        if obj:
            user_company = self.get_user_company(request)
            if user_company:
                return obj.company == user_company
            return False
        
        # Для общего доступа (список) разрешаем, если есть компания
        user_company = self.get_user_company(request)
        return user_company is not None
    
    def has_delete_permission(self, request, obj=None):
        """Проверка права на удаление продукта"""
        # Сначала проверяем базовые права
        if not super().has_delete_permission(request, obj):
            return False
        
        # Суперпользователи могут удалять любые продукты
        if request.user.is_superuser:
            return True
        
        # Для конкретного объекта проверяем принадлежность компании
        if obj:
            user_company = self.get_user_company(request)
            if user_company:
                return obj.company == user_company
            return False
        
        # Для общего доступа (список) разрешаем, если есть компания
        user_company = self.get_user_company(request)
        return user_company is not None
    
    def get_price_display(self, obj):
        if obj.price:
            return f"{obj.price} {obj.currency}"
        return "Договорная"
    get_price_display.short_description = "Цена"
    
    def get_price_conversions(self, obj):
        """Display price conversions in other currencies"""
        if not obj.price:
            return "-"
        
        conversions = []
        for currency in ['KZT', 'RUB', 'USD']:
            if currency != obj.currency:
                converted_price = obj.get_price_in(currency)
                if converted_price:
                    conversions.append(f"{converted_price} {currency}")
        
        if conversions:
            conversion_text = " | ".join(conversions)
            return format_html(
                '<span style="color: #666; font-size: 0.9em;">{}</span>', 
                conversion_text
            )
        return "-"
    get_price_conversions.short_description = "Конвертация валют"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ["product", "alt_text", "is_primary", "created_at"]
    list_filter = ["is_primary", "created_at"]
    search_fields = ["product__title", "alt_text"]
