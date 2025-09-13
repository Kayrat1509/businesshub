from django.contrib import admin
from django.utils.html import format_html
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, PatternFill, Alignment
import datetime

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["display_name", "parent", "slug", "is_active", "products_count", "companies_count", "created_at"]
    list_filter = ["is_active", "parent", "created_at"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ["is_active"]
    ordering = ["parent__name", "name"]
    list_per_page = 50
    actions = ['export_to_excel']
    change_list_template = 'admin/categories/category/change_list.html'  # Шаблон с кнопкой импорта из Excel

    fieldsets = (
        ("Основная информация", {
            "fields": ("name", "slug", "parent", "is_active")
        }),
        ("Служебная информация", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    readonly_fields = ["created_at", "updated_at"]

    def display_name(self, obj):
        if obj.parent:
            return format_html("&nbsp;&nbsp;&nbsp;&nbsp;└─ {}", obj.name)
        return format_html("<strong>{}</strong>", obj.name)
    display_name.short_description = "Название"
    display_name.admin_order_field = "name"

    def products_count(self, obj):
        count = obj.products.count()
        if count > 0:
            return format_html('<span style="color: green; font-weight: bold;">{}</span>', count)
        return count
    products_count.short_description = "Товары"

    def companies_count(self, obj):
        from app.companies.models import Company
        count = Company.objects.filter(categories=obj).count()
        if count > 0:
            return format_html('<span style="color: blue; font-weight: bold;">{}</span>', count)
        return count
    companies_count.short_description = "Компании"

    def export_to_excel(self, request, queryset):
        """
        Экспорт выбранных категорий в Excel файл
        """
        # Создаём новый workbook
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Категории"
        
        # Определяем заголовки колонок
        headers = ['ID', 'Название', 'Slug', 'Родитель']
        
        # Стилизация заголовков
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        
        # Добавляем заголовки
        for col_num, header in enumerate(headers, 1):
            cell = worksheet.cell(row=1, column=col_num, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
        
        # Добавляем данные категорий
        for row_num, category in enumerate(queryset, 2):
            worksheet.cell(row=row_num, column=1, value=category.id)
            worksheet.cell(row=row_num, column=2, value=category.name)
            worksheet.cell(row=row_num, column=3, value=category.slug)
            # Для родительской категории показываем name, если есть, иначе пусто
            parent_name = category.parent.name if category.parent else ""
            worksheet.cell(row=row_num, column=4, value=parent_name)
        
        # Автоматическое изменение ширины колонок
        for col_num in range(1, len(headers) + 1):
            column = get_column_letter(col_num)
            max_length = 0
            for cell in worksheet[column]:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            # Устанавливаем ширину с небольшим отступом
            adjusted_width = min(max_length + 2, 50)  # Максимальная ширина 50 символов
            worksheet.column_dimensions[column].width = adjusted_width
        
        # Создаём HTTP ответ с Excel файлом
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
        # Генерируем имя файла с текущей датой
        current_date = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'categories_{current_date}.xlsx'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Сохраняем workbook в ответ
        workbook.save(response)
        
        # Сообщение об успешном экспорте (если middleware доступен)
        try:
            self.message_user(request, f'Экспортировано {queryset.count()} категорий в файл {filename}')
        except:
            # Игнорируем ошибку если middleware недоступен
            pass
        
        return response
    
    export_to_excel.short_description = "Экспорт в Excel"

