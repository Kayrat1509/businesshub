from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Favorite


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('email', 'role', 'phone')}),
    )
    list_display = ['username', 'email', 'role', 'is_staff', 'created_at']
    list_filter = ['role', 'is_staff', 'is_active', 'created_at']
    search_fields = ['username', 'email']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'company__name']