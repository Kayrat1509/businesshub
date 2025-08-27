from django.contrib import admin
from .models import Product, ProductImage


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'category', 'price', 'currency', 'is_service', 'in_stock', 'is_active']
    list_filter = ['is_service', 'currency', 'in_stock', 'is_active', 'category', 'created_at']
    search_fields = ['title', 'description', 'sku', 'company__name']
    list_editable = ['in_stock', 'is_active']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('company', 'title', 'sku', 'description', 'category')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'currency', 'is_service', 'in_stock')
        }),
        ('Media & Settings', {
            'fields': ('images', 'is_active')
        }),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt_text', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['product__title', 'alt_text']