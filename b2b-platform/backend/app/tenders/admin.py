from django.contrib import admin
from .models import Tender, TenderAttachment


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'city', 'status', 'deadline_date', 'created_at']
    list_filter = ['status', 'city', 'categories', 'deadline_date', 'created_at']
    search_fields = ['title', 'description', 'author__email', 'city']
    list_editable = ['status']
    filter_horizontal = ['categories']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'author', 'description', 'categories')
        }),
        ('Location & Budget', {
            'fields': ('city', 'budget_min', 'budget_max', 'deadline_date')
        }),
        ('Moderation', {
            'fields': ('status', 'admin_comment')
        }),
        ('Attachments', {
            'fields': ('attachments',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )


@admin.register(TenderAttachment)
class TenderAttachmentAdmin(admin.ModelAdmin):
    list_display = ['tender', 'filename', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['tender__title', 'filename']