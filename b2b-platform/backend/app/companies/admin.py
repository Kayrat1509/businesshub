from django.contrib import admin
from django import forms
from django.forms import Textarea, TextInput
import json

from .models import Branch, Company, Employee


class CompanyAdminForm(forms.ModelForm):
    # Контакты
    phone_numbers = forms.CharField(
        label="Номера телефонов", 
        max_length=500, 
        required=False,
        help_text="Введите номера телефонов через запятую, например: +7 (999) 123-45-67, +7 (999) 765-43-21",
        widget=TextInput(attrs={'size': '60'})
    )
    emails = forms.CharField(
        label="Email адреса", 
        max_length=500, 
        required=False,
        help_text="Введите email адреса через запятую, например: info@company.com, sales@company.com",
        widget=TextInput(attrs={'size': '60'})
    )
    website = forms.URLField(
        label="Веб-сайт", 
        required=False,
        help_text="Введите адрес веб-сайта, например: https://company.com",
        widget=TextInput(attrs={'size': '60'})
    )
    
    # Социальные сети
    facebook = forms.URLField(
        label="Facebook", 
        required=False,
        help_text="Ссылка на Facebook страницу",
        widget=TextInput(attrs={'size': '60'})
    )
    instagram = forms.URLField(
        label="Instagram", 
        required=False,
        help_text="Ссылка на Instagram профиль",
        widget=TextInput(attrs={'size': '60'})
    )
    telegram = forms.URLField(
        label="Telegram", 
        required=False,
        help_text="Ссылка на Telegram канал или бот",
        widget=TextInput(attrs={'size': '60'})
    )
    whatsapp = forms.URLField(
        label="WhatsApp", 
        required=False,
        help_text="Ссылка на WhatsApp Business",
        widget=TextInput(attrs={'size': '60'})
    )
    twitter = forms.URLField(
        label="Twitter", 
        required=False,
        help_text="Ссылка на Twitter профиль",
        widget=TextInput(attrs={'size': '60'})
    )
    linkedin = forms.URLField(
        label="LinkedIn", 
        required=False,
        help_text="Ссылка на LinkedIn компании",
        widget=TextInput(attrs={'size': '60'})
    )
    
    # Юридическая информация
    inn = forms.CharField(
        label="ИНН", 
        max_length=12, 
        required=False,
        help_text="Индивидуальный налоговый номер (10 или 12 цифр)",
        widget=TextInput(attrs={'size': '20'})
    )
    kpp = forms.CharField(
        label="КПП", 
        max_length=9, 
        required=False,
        help_text="Код причины постановки на учет (9 цифр)",
        widget=TextInput(attrs={'size': '20'})
    )
    legal_name = forms.CharField(
        label="Полное наименование организации", 
        max_length=300, 
        required=False,
        help_text="Официальное полное наименование организации",
        widget=TextInput(attrs={'size': '80'})
    )
    
    # Способы оплаты
    accepts_cash = forms.BooleanField(label="Принимаем наличные", required=False)
    accepts_cards = forms.BooleanField(label="Принимаем банковские карты", required=False)
    accepts_transfers = forms.BooleanField(label="Принимаем банковские переводы", required=False)
    accepts_crypto = forms.BooleanField(label="Принимаем криптовалюту", required=False)
    
    # График работы
    work_hours = forms.CharField(
        label="График работы", 
        max_length=200, 
        required=False,
        help_text="Например: Пн-Пт 9:00-18:00, Сб 10:00-16:00, Вс - выходной",
        widget=TextInput(attrs={'size': '60'})
    )

    class Meta:
        model = Company
        exclude = ['contacts', 'legal_info', 'payment_methods', 'work_schedule']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            # Заполнение полей из JSON данных при редактировании
            contacts = self.instance.contacts or {}
            legal_info = self.instance.legal_info or {}
            payment_methods = self.instance.payment_methods or []
            work_schedule = self.instance.work_schedule or {}
            
            self.fields['phone_numbers'].initial = ', '.join(contacts.get('phones', []))
            self.fields['emails'].initial = ', '.join(contacts.get('emails', []))
            self.fields['website'].initial = contacts.get('website', '')
            
            # Социальные сети
            social = contacts.get('social', {})
            self.fields['facebook'].initial = social.get('facebook', '')
            self.fields['instagram'].initial = social.get('instagram', '')
            self.fields['telegram'].initial = social.get('telegram', '')
            self.fields['whatsapp'].initial = social.get('whatsapp', '')
            self.fields['twitter'].initial = social.get('twitter', '')
            self.fields['linkedin'].initial = social.get('linkedin', '')
            
            self.fields['inn'].initial = legal_info.get('inn', '')
            self.fields['kpp'].initial = legal_info.get('kpp', '')
            self.fields['legal_name'].initial = legal_info.get('legal_name', '')
            
            self.fields['accepts_cash'].initial = 'CASH' in payment_methods
            self.fields['accepts_cards'].initial = 'CARD' in payment_methods
            self.fields['accepts_transfers'].initial = 'TRANSFER' in payment_methods
            self.fields['accepts_crypto'].initial = 'CRYPTO' in payment_methods
            
            self.fields['work_hours'].initial = work_schedule.get('description', '')

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Set default status to APPROVED for admin created companies
        if not instance.pk and not hasattr(instance, '_state'):
            instance.status = 'APPROVED'
        
        # Сохранение контактов в JSON
        phones = [phone.strip() for phone in self.cleaned_data['phone_numbers'].split(',') if phone.strip()]
        emails = [email.strip() for email in self.cleaned_data['emails'].split(',') if email.strip()]
        website = self.cleaned_data['website']
        
        # Социальные сети
        social_media = {}
        for platform in ['facebook', 'instagram', 'telegram', 'whatsapp', 'twitter', 'linkedin']:
            if self.cleaned_data[platform]:
                social_media[platform] = self.cleaned_data[platform]
        
        instance.contacts = {
            'phones': phones,
            'emails': emails,
            'website': website,
            'social': social_media
        }
        
        # Сохранение юридической информации в JSON
        instance.legal_info = {
            'inn': self.cleaned_data['inn'],
            'kpp': self.cleaned_data['kpp'],
            'legal_name': self.cleaned_data['legal_name']
        }
        
        # Сохранение способов оплаты в JSON
        payment_methods = []
        if self.cleaned_data['accepts_cash']:
            payment_methods.append('CASH')
        if self.cleaned_data['accepts_cards']:
            payment_methods.append('CARD')
        if self.cleaned_data['accepts_transfers']:
            payment_methods.append('TRANSFER')
        if self.cleaned_data['accepts_crypto']:
            payment_methods.append('CRYPTO')
        
        instance.payment_methods = payment_methods
        
        # Сохранение графика работы в JSON
        instance.work_schedule = {
            'description': self.cleaned_data['work_hours']
        }
        
        if commit:
            instance.save()
        return instance


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    form = CompanyAdminForm
    list_display = ["name", "owner", "city", "status", "rating", "created_at"]
    list_filter = ["status", "city", "categories", "created_at"]
    search_fields = ["name", "description", "owner__email"]
    list_editable = ["status"]
    filter_horizontal = ["categories"]
    readonly_fields = ["rating", "created_at", "updated_at"]

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("name", "owner", "logo", "description", "categories")},
        ),
        (
            "Контактная информация",
            {"fields": ("phone_numbers", "emails", "website")},
        ),
        (
            "Социальные сети",
            {"fields": ("facebook", "instagram", "telegram", "whatsapp", "twitter", "linkedin"), "classes": ["collapse"]},
        ),
        (
            "Местоположение",
            {"fields": ("city", "address", "latitude", "longitude")},
        ),
        (
            "Юридическая информация",
            {"fields": ("legal_name", "inn", "kpp")},
        ),
        (
            "Способы оплаты",
            {"fields": ("accepts_cash", "accepts_cards", "accepts_transfers", "accepts_crypto")},
        ),
        (
            "График работы и детали",
            {"fields": ("work_hours", "staff_count", "branches_count")},
        ),
        ("Статус и рейтинг", {"fields": ("status", "rating")}),
        (
            "Временные метки",
            {"fields": ("created_at", "updated_at"), "classes": ["collapse"]},
        ),
    )


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ["company", "address", "phone", "created_at"]
    list_filter = ["company", "created_at"]
    search_fields = ["company__name", "address", "phone"]


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["full_name", "company", "position", "phone", "email"]
    list_filter = ["company", "position", "created_at"]
    search_fields = ["full_name", "company__name", "position", "email"]
