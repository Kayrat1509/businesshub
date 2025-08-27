from django.contrib import admin
from .models import Company, Branch, Employee


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'city', 'status', 'rating', 'created_at']
    list_filter = ['status', 'city', 'categories', 'created_at']
    search_fields = ['name', 'description', 'owner__email']
    list_editable = ['status']
    filter_horizontal = ['categories']
    readonly_fields = ['rating', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'owner', 'logo', 'description', 'categories')
        }),
        ('Contact & Location', {
            'fields': ('contacts', 'city', 'address', 'latitude', 'longitude')
        }),
        ('Company Details', {
            'fields': ('legal_info', 'payment_methods', 'work_schedule', 'staff_count', 'branches_count')
        }),
        ('Status & Rating', {
            'fields': ('status', 'rating')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['company', 'address', 'phone', 'created_at']
    list_filter = ['company', 'created_at']
    search_fields = ['company__name', 'address', 'phone']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'company', 'position', 'phone', 'email']
    list_filter = ['company', 'position', 'created_at']
    search_fields = ['full_name', 'company__name', 'position', 'email']