from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, Widget
from .models import Product
from app.companies.models import Company
from app.categories.models import Category
from django.contrib.auth import get_user_model

User = get_user_model()


class RussianBooleanWidget(Widget):
    """
    Кастомный виджет для булевых полей с поддержкой русских "да"/"нет"
    """
    TRUE_VALUES = ['да', 'ДА', 'Да']
    FALSE_VALUES = ['нет', 'НЕТ', 'Нет']
    
    def clean(self, value, row=None, **kwargs):
        """
        Преобразует входящее значение в булево
        Если пустое значение - возвращает None (будет использоваться значение по умолчанию)
        """
        if value in ('', None, 'NULL', 'null'):
            return None  # Пустое значение - не обрабатываем, оставляем значение по умолчанию
        
        # Приводим к строке и убираем лишние пробелы
        str_value = str(value).strip()
        
        if str_value in self.TRUE_VALUES:
            return True
        elif str_value in self.FALSE_VALUES:
            return False
        else:
            # Если значение не распознано, возвращаем None для использования значения по умолчанию
            return None
    
    def render(self, value, obj=None):
        """
        Преобразует булево значение в русский текст для экспорта
        """
        if value is True:
            return 'да'
        elif value is False:
            return 'нет'
        return ''


class EmptySkipWidget(Widget):
    """
    Базовый виджет, который пропускает пустые значения без ошибок
    """
    def clean(self, value, row=None, **kwargs):
        if value in ('', None, 'NULL', 'null'):
            return None  # Пустое значение - не обрабатываем
        return value


class StockBooleanWidget(Widget):
    """
    Кастомный виджет для поля остатков (in_stock)
    Преобразует числовые значения в булевые
    """
    def clean(self, value, row=None, **kwargs):
        """
        Преобразует входящее значение в булево для поля остатков
        Если число > 0 - True (есть в наличии)
        Если число <= 0 - False (нет в наличии)
        Если пустое значение - None (использовать дефолт)
        """
        if value in ('', None, 'NULL', 'null'):
            return None  # Пустое значение - не обрабатываем
        
        try:
            # Преобразуем в число
            numeric_value = float(value)
            # Если больше 0 - товар в наличии
            return numeric_value > 0
        except (ValueError, TypeError):
            # Если не удалось преобразовать в число, возвращаем None
            print(f"Не удалось преобразовать остаток '{value}' в число")
            return None
    
    def render(self, value, obj=None):
        """
        Преобразует булево значение в текст для экспорта
        """
        if value is True:
            return 'в наличии'
        elif value is False:
            return 'нет в наличии'
        return ''


class AutoCreateForeignKeyWidget(ForeignKeyWidget):
    """
    Кастомный виджет для ForeignKey с автоматическим созданием объектов
    """
    def clean(self, value, row=None, **kwargs):
        if value in ('', None, 'NULL', 'null'):
            # Пустое значение допустимо для необязательных полей
            return None
        
        # Очищаем значение от лишних пробелов и символов
        clean_value = str(value).strip()
        
        try:
            # Пытаемся найти объект по указанному полю (точное соответствие)
            lookup = {self.field: clean_value}
            return self.model.objects.get(**lookup)
        except self.model.DoesNotExist:
            # Если объект не найден, создаем его автоматически
            print(f"Автоматически создаем {self.model.__name__}: {clean_value}")
            
            # Подготавливаем данные для создания объекта
            create_data = {self.field: clean_value}
            
            # Для категории добавляем slug
            if self.model == Category:
                # Создаем slug из названия
                import re
                slug = re.sub(r'[^\w\s-]', '', clean_value).strip().lower()
                slug = re.sub(r'[-\s]+', '-', slug)
                create_data['slug'] = slug
                create_data['is_active'] = True
            
            # Для компании добавляем владельца
            elif self.model == Company:
                # Находим суперпользователя или первого пользователя
                owner = User.objects.filter(is_superuser=True).first() or User.objects.first()
                if owner:
                    create_data['owner'] = owner
                else:
                    print(f"Внимание: Не найден пользователь для назначения владельцем компании '{clean_value}'")
                    return None
            
            # Используем get_or_create для избежания дубликатов
            obj, created = self.model.objects.get_or_create(**create_data)
            if created:
                print(f"Создан новый {self.model.__name__}: {clean_value}")
            else:
                print(f"Найден существующий {self.model.__name__}: {clean_value}")
            return obj
        except Exception as e:
            # Если произошла другая ошибка, логируем и возвращаем None
            print(f"Ошибка при создании {self.model.__name__} '{clean_value}': {str(e)}")
            return None


class RequiredAutoCreateForeignKeyWidget(AutoCreateForeignKeyWidget):
    """
    Кастомный виджет для обязательных ForeignKey с автоматическим созданием объектов
    """
    def clean(self, value, row=None, **kwargs):
        if value in ('', None, 'NULL', 'null'):
            # Для обязательного поля пустое значение недопустимо
            raise ValueError("Поле 'Компания' не может быть пустым")
        
        # Очищаем значение от лишних пробелов и символов
        clean_value = str(value).strip()
        
        try:
            # Пытаемся найти компанию по точному названию
            return Company.objects.get(name=clean_value)
        except Company.DoesNotExist:
            # Если компания не найдена, создаем её
            print(f"Автоматически создаем компанию: {clean_value}")
            
            # Находим суперпользователя или первого пользователя как владельца
            owner = User.objects.filter(is_superuser=True).first() or User.objects.first()
            if not owner:
                raise ValueError(f"Не найден пользователь для назначения владельцем компании '{clean_value}'")
            
            # Используем get_or_create для избежания дубликатов при параллельных запросах
            company, created = Company.objects.get_or_create(
                name=clean_value,
                defaults={
                    'owner': owner,
                    'status': 'APPROVED'  # Автоматически одобряем компании при импорте
                }
            )
            
            if created:
                print(f"Создана новая компания: {clean_value} (Владелец: {owner.username})")
            else:
                print(f"Найдена существующая компания: {clean_value}")
                
            return company
        except Exception as e:
            raise ValueError(f"Ошибка при обработке компании '{clean_value}': {str(e)}")


class ProductResource(resources.ModelResource):
    """
    Ресурс для импорта/экспорта продуктов через django-import-export
    Поддерживает только .xlsx формат с русскими булевыми значениями
    """
    
    # Компания (обязательное поле с автоматическим созданием)
    company = fields.Field(
        column_name='Компания',
        attribute='company',
        widget=RequiredAutoCreateForeignKeyWidget(Company, field='name')
    )
    
    # Поле с кастомным названием колонки
    title = fields.Field(
        column_name='Название',
        attribute='title',
        widget=EmptySkipWidget()
    )
    
    # Категория по названию (с автоматическим созданием)
    category = fields.Field(
        column_name='Категория',
        attribute='category',
        widget=AutoCreateForeignKeyWidget(Category, field='name')
    )
    
    # Описание
    description = fields.Field(
        column_name='Описание',
        attribute='description',
        widget=EmptySkipWidget()
    )
    
    # Цена
    price = fields.Field(
        column_name='Цена',
        attribute='price',
        widget=EmptySkipWidget()
    )
    
    # Остаток (преобразуем числовые значения в булевые)
    in_stock = fields.Field(
        column_name='Остаток',
        attribute='in_stock',
        widget=StockBooleanWidget()
    )
    
    # Активен с русскими булевыми значениями (только "да"/"нет")
    is_active = fields.Field(
        column_name='Активен',
        attribute='is_active',
        widget=RussianBooleanWidget()
    )

    class Meta:
        model = Product
        # Поля для импорта/экспорта согласно требованиям (добавлена компания, убран created_at)
        fields = ('id', 'company', 'title', 'category', 'description', 'price', 'in_stock', 'is_active')
        # Порядок экспорта колонок
        export_order = ('id', 'company', 'title', 'category', 'description', 'price', 'in_stock', 'is_active')
        # ID не обязателен при импорте
        import_id_fields = ('id',)
        # Пропускаем неизмененные записи
        skip_unchanged = True
        # Отчет о пропущенных записях
        report_skipped = True

    def before_import_row(self, row, **kwargs):
        """
        Обработка строки перед импортом
        Очистка пустых значений и подготовка данных
        """
        # Логируем строку для отладки
        print(f"Обрабатываем строку: {dict(row)}")
        
        # Проверяем обязательное поле 'Компания'
        company_name = row.get('Компания', '').strip() if row.get('Компания') else ''
        if not company_name:
            raise ValueError("Поле 'Компания' является обязательным и не может быть пустым")
        
        # Удаляем пустые значения из строки для использования дефолтных значений модели
        # (кроме обязательных полей)
        row_dict = dict(row)
        for key, value in list(row_dict.items()):
            if key != 'Компания' and value in ['', None, 'NULL', 'null']:
                # Удаляем пустые значения, чтобы использовались значения по умолчанию
                del row[key]
                print(f"Удалили пустое значение для поля: {key}")

    def skip_row(self, instance, original, row, import_validation_errors=None):
        """
        Определяем, нужно ли пропустить строку при импорте
        Пропускаем строки без обязательных полей
        """
        # Пропускаем строки без названия продукта
        if not row.get('Название', '').strip():
            print(f"Пропускаем строку без названия: {dict(row)}")
            return True
            
        # Проверяем наличие компании
        if not row.get('Компания', '').strip():
            print(f"Пропускаем строку без компании: {dict(row)}")
            return True
            
        return super().skip_row(instance, original, row, import_validation_errors)

    def get_instance(self, instance_loader, row):
        """
        Получение существующего экземпляра для обновления
        Ищем по ID или создаем новый
        """
        try:
            return super().get_instance(instance_loader, row)
        except Exception as e:
            print(f"Не удалось найти экземпляр: {e}")
            # Если не можем найти по ID, создаем новый экземпляр
            return None

    def before_save_instance(self, instance, *args, **kwargs):
        """
        Действия перед сохранением экземпляра
        Устанавливаем значения по умолчанию для обязательных полей
        """
        # Получаем dry_run из args или kwargs
        dry_run = False
        if len(args) > 1:
            dry_run = args[1]  # second positional argument
        elif 'dry_run' in kwargs:
            dry_run = kwargs['dry_run']
        
        # Проверяем, что компания установлена (должна быть установлена виджетом)
        if not hasattr(instance, 'company') or not instance.company:
            raise ValueError("Компания не может быть пустой")
        
        # Устанавливаем валюту по умолчанию
        if not hasattr(instance, 'currency') or not instance.currency:
            instance.currency = 'KZT'
        
        if not dry_run:
            print(f"Подготовка к сохранению: {instance.title} (Компания: {instance.company.name})")
    
    def after_save_instance(self, instance, *args, **kwargs):
        """
        Действия после сохранения экземпляра
        """
        # Получаем dry_run из args или kwargs
        dry_run = False
        if len(args) > 1:
            dry_run = args[1]  # second positional argument
        elif 'dry_run' in kwargs:
            dry_run = kwargs['dry_run']
            
        if not dry_run:
            print(f"Успешно импортирован продукт: {instance.title} (ID: {instance.id}, Компания: {instance.company.name})")

    def import_field(self, field, obj, data, is_m2m=False, **kwargs):
        """
        Кастомная обработка полей при импорте
        Пропускаем пустые значения без ошибок (кроме обязательных)
        """
        if field.attribute and field.column_name in data:
            value = data[field.column_name]
            # Для компании не пропускаем пустые значения - это обязательное поле
            if field.column_name != 'Компания' and value in ['', None, 'NULL', 'null']:
                # Пропускаем пустые значения - оставляем текущее значение поля
                return
        
        return super().import_field(field, obj, data, is_m2m, **kwargs)

    def import_row(self, row, instance_loader, **kwargs):
        """
        Кастомная обработка импорта строки с улучшенной обработкой ошибок
        """
        try:
            return super().import_row(row, instance_loader, **kwargs)
        except Exception as e:
            # Добавляем информацию о строке к ошибке
            row_info = f"Строка с данными: {dict(row)}"
            if hasattr(e, 'args') and e.args:
                e.args = (f"{e.args[0]}. {row_info}",) + e.args[1:]
            else:
                e.args = (f"Ошибка импорта. {row_info}",)
            raise e