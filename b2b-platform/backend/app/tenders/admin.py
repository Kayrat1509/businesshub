from django.contrib import admin
from django import forms
from django.forms import TextInput, Textarea, DateInput, NumberInput, Select
from django.utils.html import format_html
from django.urls import reverse

from .models import Tender, TenderAttachment


class TenderAdminForm(forms.ModelForm):
    # Custom field for attachments as simple text input
    attachment_urls = forms.CharField(
        label="Ссылки на вложения",
        max_length=2000,
        required=False,
        help_text="Введите ссылки на файлы через запятую, например: https://example.com/file1.pdf, https://example.com/file2.docx",
        widget=Textarea(attrs={'rows': 3, 'cols': 80, 'placeholder': 'https://example.com/file1.pdf, https://example.com/file2.docx'})
    )

    class Meta:
        model = Tender
        exclude = ['attachments']
        widgets = {
            'title': TextInput(attrs={'size': '80'}),
            'description': Textarea(attrs={'rows': 4, 'cols': 80}),
            'city': TextInput(attrs={'size': '40', 'placeholder': 'Например: Алматы, Москва, Ташкент'}),
            'budget_min': NumberInput(attrs={'min': '0', 'step': '0.01', 'placeholder': '0.00'}),
            'budget_max': NumberInput(attrs={'min': '0', 'step': '0.01', 'placeholder': '0.00'}),
            'deadline_date': DateInput(attrs={'type': 'date'}),
            'status': Select(attrs={'style': 'width: 200px;'}),
            'admin_comment': Textarea(attrs={'rows': 3, 'cols': 80, 'placeholder': 'Комментарий администратора (при отклонении)'}),
        }
        help_texts = {
            'title': 'Название тендера',
            'description': 'Подробное описание требований к товарам или услугам',
            'city': 'Город, где требуются товары/услуги',
            'budget_min': 'Минимальная сумма бюджета (необязательно)',
            'budget_max': 'Максимальная сумма бюджета (необязательно)',
            'deadline_date': 'Крайний срок подачи предложений',
            'status': 'Статус тендера (на модерации, одобрен, отклонен)',
            'admin_comment': 'Комментарий администратора (обязательно при отклонении)',
            'author': 'Пользователь, создавший тендер',
            'categories': 'Категории товаров/услуг для данного тендера',
        }

    def __init__(self, *args, **kwargs):
        # Import Company model here to avoid circular imports
        from app.companies.models import Company
        
        super().__init__(*args, **kwargs)
        
        # Set up company field
        self.fields['company'] = forms.ModelChoiceField(
            queryset=Company.objects.filter(status="APPROVED").order_by('name'),
            label="Компания",
            required=False,
            empty_label="Выберите компанию",
            help_text="Выберите компанию для этого тендера. Если не выбрана, будет использована компания автора.",
            widget=Select(attrs={'style': 'width: 300px;'})
        )
        
        if self.instance and self.instance.pk:
            # Load existing attachments URLs into the text field
            attachments = self.instance.attachments or []
            self.fields['attachment_urls'].initial = ', '.join(attachments)
            
            # Set initial company value
            try:
                author_company = self.instance.author.companies.filter(status="APPROVED").first()
                if author_company:
                    self.fields['company'].initial = author_company
            except:
                # Handle case where author doesn't have companies
                pass

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Convert attachment URLs from text field to JSON list
        attachment_urls_text = self.cleaned_data['attachment_urls']
        if attachment_urls_text:
            # Split by comma and clean up URLs
            urls = [url.strip() for url in attachment_urls_text.split(',') if url.strip()]
            instance.attachments = urls
        else:
            instance.attachments = []
        
        if commit:
            instance.save()
        return instance


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    form = TenderAdminForm
    list_display = ["title_with_link", "company_info", "city", "budget_info", "deadline_date", "status", "created_at"]
    list_filter = ["status", "city", "categories", "deadline_date", "created_at"]
    search_fields = ["title", "description", "author__email", "city", "author__companies__name"]
    list_editable = ["status"]
    filter_horizontal = ["categories"]
    readonly_fields = ["created_at", "updated_at", "company_display"]
    list_per_page = 25

    fieldsets = (
        ("Основная информация", {"fields": ("title", "author", "company", "company_display", "description", "categories")}),
        (
            "Местоположение и бюджет",
            {"fields": ("city", "budget_min", "budget_max", "deadline_date")},
        ),
        ("Модерация", {"fields": ("status", "admin_comment")}),
        ("Вложения", {"fields": ("attachment_urls",)}),
        (
            "Служебная информация",
            {"fields": ("created_at", "updated_at"), "classes": ["collapse"]},
        ),
    )

    def title_with_link(self, obj):
        """Display tender title with clickable link to company card"""
        try:
            if obj.author:
                company = obj.author.companies.filter(status="APPROVED").first()
                if company:
                    # Link to frontend company card
                    frontend_url = f"http://localhost:5173/company/{company.id}?tab=tenders"
                    return format_html(
                        '<a href="{}" target="_blank" style="color: #0066cc; text-decoration: none;">{}</a>',
                        frontend_url,
                        obj.title
                    )
        except:
            pass
        return obj.title
    title_with_link.short_description = "Название тендера"
    title_with_link.allow_tags = True

    def company_info(self, obj):
        """Display company name and description"""
        try:
            if obj.author:
                company = obj.author.companies.filter(status="APPROVED").first()
                if company:
                    description = (company.description[:50] + '...') if len(company.description) > 50 else company.description
                    return format_html(
                        '<strong>{}</strong><br><small style="color: #666;">{}</small>',
                        company.name,
                        description
                    )
        except:
            pass
        return format_html('<em style="color: #999;">Нет компании</em>')
    company_info.short_description = "Компания"
    company_info.allow_tags = True

    def company_display(self, obj):
        """Display company information in the form"""
        try:
            if obj.author:
                company = obj.author.companies.filter(status="APPROVED").first()
                if company:
                    frontend_url = f"http://localhost:5173/company/{company.id}"
                    return format_html(
                        '<p><strong>Компания:</strong> <a href="{}" target="_blank" style="color: #0066cc;">{}</a></p>'
                        '<p><strong>Описание:</strong> {}</p>'
                        '<p><strong>Город:</strong> {}</p>'
                        '<p><strong>Рейтинг:</strong> {}/5.0</p>',
                        frontend_url,
                        company.name,
                        company.description[:100] + ('...' if len(company.description) > 100 else ''),
                        company.city,
                        company.rating
                    )
        except:
            pass
        return format_html('<em style="color: #999;">У автора тендера нет компании</em>')
    company_display.short_description = "Информация о компании"
    company_display.allow_tags = True

    def budget_info(self, obj):
        """Display budget information in a formatted way"""
        if obj.budget_min and obj.budget_max:
            min_budget = f"{int(obj.budget_min):,}".replace(',', ' ')
            max_budget = f"{int(obj.budget_max):,}".replace(',', ' ')
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">{} - {} ₸</span>',
                min_budget,
                max_budget
            )
        elif obj.budget_min:
            min_budget = f"{int(obj.budget_min):,}".replace(',', ' ')
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">от {} ₸</span>',
                min_budget
            )
        elif obj.budget_max:
            max_budget = f"{int(obj.budget_max):,}".replace(',', ' ')
            return format_html(
                '<span style="color: #0066cc; font-weight: bold;">до {} ₸</span>',
                max_budget
            )
        return format_html('<em style="color: #999;">Не указан</em>')
    budget_info.short_description = "Бюджет"
    budget_info.allow_tags = True

    def get_queryset(self, request):
        """Optimize queries by prefetching related companies"""
        queryset = super().get_queryset(request)
        return queryset.select_related('author').prefetch_related('author__companies', 'categories')


@admin.register(TenderAttachment)
class TenderAttachmentAdmin(admin.ModelAdmin):
    list_display = ["tender", "filename", "file_size", "uploaded_at"]
    list_filter = ["uploaded_at"]
    search_fields = ["tender__title", "filename"]
