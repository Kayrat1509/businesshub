from django import forms
from django.forms import ModelChoiceField
from app.categories.models import Category
from .models import Product


class CategoryModelChoiceField(ModelChoiceField):
    """Custom field for displaying categories with hierarchy"""
    
    def __init__(self, *args, **kwargs):
        kwargs['queryset'] = Category.objects.filter(is_active=True).select_related('parent')
        super().__init__(*args, **kwargs)
    
    def label_from_instance(self, obj):
        """Create hierarchical label for category"""
        path_parts = []
        current = obj
        
        # Build path from bottom to top
        while current:
            path_parts.append(current.name)
            current = current.parent
        
        # Reverse to get top-to-bottom path
        path_parts.reverse()
        
        # Create indented display
        if len(path_parts) == 1:
            # Top level category
            return f"{path_parts[0]}"
        elif len(path_parts) == 2:
            # Second level category
            return f"  └─ {path_parts[1]}"
        elif len(path_parts) == 3:
            # Third level category
            return f"    └─ {path_parts[2]}"
        else:
            # More levels (shouldn't happen with current structure)
            indent = "  " * (len(path_parts) - 1)
            return f"{indent}└─ {path_parts[-1]}"
    
    def get_grouped_choices(self):
        """Group choices by parent categories for better display"""
        choices = []
        
        # Get all parent categories (top level)
        parent_categories = Category.objects.filter(
            parent__isnull=True, is_active=True
        ).order_by('name')
        
        for parent in parent_categories:
            # Add parent category
            choices.append((parent.id, parent.name))
            
            # Get direct children
            children = parent.children.filter(is_active=True).order_by('name')
            
            for child in children:
                # Add child category
                choices.append((child.id, f"  └─ {child.name}"))
                
                # Get grandchildren
                grandchildren = child.children.filter(is_active=True).order_by('name')
                
                for grandchild in grandchildren:
                    choices.append((grandchild.id, f"    └─ {grandchild.name}"))
        
        return choices


class ProductAdminForm(forms.ModelForm):
    """Enhanced form for Product admin with custom category field"""
    
    category = CategoryModelChoiceField(
        required=False,
        empty_label="Выберите категорию",
        help_text="Выберите наиболее подходящую категорию для товара"
    )
    
    class Meta:
        model = Product
        fields = '__all__'
        widgets = {
            'title': forms.TextInput(attrs={'size': '60'}),
            'sku': forms.TextInput(attrs={'size': '30', 'placeholder': 'Артикул товара'}),
            'description': forms.Textarea(attrs={'rows': 4, 'cols': 80}),
            'price': forms.NumberInput(attrs={'min': '0', 'step': '0.01'}),
            'currency': forms.Select(attrs={'style': 'width: 120px;'}),
            'is_service': forms.CheckboxInput(),
            'in_stock': forms.CheckboxInput(),
            'is_active': forms.CheckboxInput(),
        }
        help_texts = {
            'title': 'Введите название товара или услуги',
            'sku': 'Уникальный артикул товара (опционально)',
            'description': 'Подробное описание товара или услуги',
            'price': 'Цена за единицу товара/услуги (оставьте пустым, если цена договорная)',
            'currency': 'Валюта цены',
            'is_service': 'Отметьте, если это услуга (а не товар)',
            'in_stock': 'Отметьте, если товар есть в наличии',
            'is_active': 'Отметьте для публикации товара на сайте',
            'company': 'Выберите компанию-поставщика',
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Ensure "Другое" categories exist before rendering form
        self._ensure_other_categories()
        
        # Update category field choices
        if 'category' in self.fields:
            field = self.fields['category']
            grouped_choices = self._get_grouped_choices()
            field.choices = [('', field.empty_label)] + grouped_choices
    
    def _get_grouped_choices(self):
        """Get grouped choices for categories"""
        choices = []
        
        # Get all parent categories (top level)
        parent_categories = Category.objects.filter(
            parent__isnull=True, is_active=True
        ).order_by('name')
        
        for parent in parent_categories:
            # Add parent category
            choices.append((parent.id, parent.name))
            
            # Get direct children
            children = parent.children.filter(is_active=True).order_by('name')
            
            for child in children:
                # Add child category
                choices.append((child.id, f"  └─ {child.name}"))
                
                # Get grandchildren
                grandchildren = child.children.filter(is_active=True).order_by('name')
                
                for grandchild in grandchildren:
                    choices.append((grandchild.id, f"    └─ {grandchild.name}"))
        
        return choices
    
    def _ensure_other_categories(self):
        """Ensure 'Другое' categories exist in all groups"""
        # Get all parent categories (top level)
        parent_categories = Category.objects.filter(parent__isnull=True, is_active=True)
        
        for parent in parent_categories:
            # Check if "Другое" exists among direct children
            has_other = parent.children.filter(name="Другое", is_active=True).exists()
            
            if not has_other:
                # Create "Другое" for this parent category
                Category.objects.get_or_create(
                    name="Другое",
                    parent=parent,
                    defaults={
                        'is_active': True,
                        'slug': f'other-{parent.slug}' if parent.slug else f'other-{parent.id}'
                    }
                )
            
            # Check child categories that have their own children
            child_categories = parent.children.filter(is_active=True)
            for child in child_categories:
                # If child has its own children, ensure it has "Другое"
                if child.children.exists():
                    child_has_other = child.children.filter(name="Другое", is_active=True).exists()
                    
                    if not child_has_other:
                        # Create "Другое" for this child category
                        Category.objects.get_or_create(
                            name="Другое",
                            parent=child,
                            defaults={
                                'is_active': True,
                                'slug': f'other-{child.slug}' if child.slug else f'other-{child.id}'
                            }
                        )