from django import forms


class CategoryImportForm(forms.Form):
    """
    Форма для импорта категорий из Excel файла
    """
    excel_file = forms.FileField(
        label="Excel файл",
        help_text="Выберите файл .xlsx с категориями",
        widget=forms.ClearableFileInput(attrs={
            'accept': '.xlsx',
            'class': 'form-control'
        })
    )
    
    def clean_excel_file(self):
        """
        Валидация загруженного файла
        """
        file = self.cleaned_data['excel_file']
        
        if not file:
            raise forms.ValidationError("Файл не выбран")
            
        # Проверяем расширение файла
        if not file.name.lower().endswith('.xlsx'):
            raise forms.ValidationError("Файл должен иметь расширение .xlsx")
            
        # Проверяем размер файла (максимум 10MB)
        if file.size > 10 * 1024 * 1024:
            raise forms.ValidationError("Размер файла не должен превышать 10MB")
            
        return file