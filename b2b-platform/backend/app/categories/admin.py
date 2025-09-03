from django.contrib import admin
from django.utils.html import format_html

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
        count = obj.companies.count()
        if count > 0:
            return format_html('<span style="color: blue; font-weight: bold;">{}</span>', count)
        return count
    companies_count.short_description = "Компании"
