from django.contrib import admin
from .models import Ad, Action


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['title', 'position', 'is_active', 'is_current', 'starts_at', 'ends_at']
    list_filter = ['position', 'is_active', 'starts_at', 'ends_at']
    search_fields = ['title', 'url']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    def is_current(self, obj):
        return obj.is_current
    is_current.boolean = True


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'is_active', 'is_current', 'starts_at', 'ends_at']
    list_filter = ['is_active', 'starts_at', 'ends_at', 'company']
    search_fields = ['title', 'description', 'company__name']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    def is_current(self, obj):
        return obj.is_current
    is_current.boolean = True