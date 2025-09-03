from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from django.forms import TextInput, Select, Textarea

from .models import Favorite, User


class UserAdminForm(forms.ModelForm):
    class Meta:
        model = User
        fields = '__all__'
        widgets = {
            'email': TextInput(attrs={'size': '40'}),
            'first_name': TextInput(attrs={'size': '30'}),
            'last_name': TextInput(attrs={'size': '30'}),
            'phone': TextInput(attrs={'size': '20', 'placeholder': '+7 (999) 123-45-67'}),
            'role': Select(attrs={'style': 'width: 200px;'}),
        }
        help_texts = {
            'email': 'Введите действующий email адрес. Будет использоваться для входа в систему.',
            'phone': 'Введите номер телефона в формате +7 (999) 123-45-67',
            'role': 'Выберите роль пользователя: Покупатель (ищет товары), Поставщик (продает товары), Администратор (управляет системой)',
            'username': 'Введите уникальное имя пользователя (латинские буквы и цифры)',
            'first_name': 'Введите имя пользователя',
            'last_name': 'Введите фамилию пользователя',
        }


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    form = UserAdminForm
    fieldsets = (
        ("Основная информация", {"fields": ("username", "email", "password")}),
        ("Персональная информация", {"fields": ("first_name", "last_name", "phone")}),
        ("Роль и права доступа", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Группы и права", {"fields": ("groups", "user_permissions"), "classes": ("collapse",)}),
        ("Важные даты", {"fields": ("last_login", "date_joined", "created_at"), "classes": ("collapse",)}),
    )
    add_fieldsets = (
        ("Основная информация", {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2"),
        }),
        ("Персональная информация", {
            "classes": ("wide",),
            "fields": ("first_name", "last_name", "phone"),
        }),
        ("Роль", {
            "classes": ("wide",),
            "fields": ("role",),
        }),
    )
    list_display = ["username", "email", "get_full_name", "role", "is_active", "is_staff", "created_at"]
    list_filter = ["role", "is_staff", "is_active", "created_at"]
    search_fields = ["username", "email", "first_name", "last_name"]
    readonly_fields = ["created_at", "last_login", "date_joined"]
    list_per_page = 25
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or "-"
    get_full_name.short_description = "Полное имя"


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ["get_user_email", "get_user_name", "company", "created_at"]
    list_filter = ["created_at", "user__role"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "company__name"]
    list_per_page = 25
    
    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = "Email пользователя"
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    get_user_name.short_description = "Имя пользователя"
