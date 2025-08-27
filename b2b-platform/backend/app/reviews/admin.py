from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['company', 'author', 'rating', 'status', 'created_at']
    list_filter = ['status', 'rating', 'created_at']
    search_fields = ['company__name', 'author__email', 'text']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Review Info', {
            'fields': ('company', 'author', 'rating', 'text')
        }),
        ('Moderation', {
            'fields': ('status', 'admin_comment')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )