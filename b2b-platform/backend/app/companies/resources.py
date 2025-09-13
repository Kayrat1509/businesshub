from import_export import resources, fields
from import_export.widgets import Widget
from .models import Company
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class JSONWidget(Widget):
    """
    Виджет для обработки JSON полей при импорте/экспорте
    При экспорте преобразует JSON в строку
    При импорте пытается преобразовать строку обратно в JSON
    """
    
    def clean(self, value, row=None, **kwargs):
        """Преобразует строку в JSON при импорте"""
        if value in ('', None, 'NULL', 'null'):
            # Возвращаем подходящий тип по умолчанию
            return {} if self.field_name in ['contacts', 'legal_info', 'work_schedule'] else []
        
        if isinstance(value, (dict, list)):
            return value
            
        try:
            return json.loads(value)
        except (ValueError, TypeError, json.JSONDecodeError):
            # Если не удалось распарсить JSON, возвращаем как есть или дефолт
            print(f"Не удалось распарсить JSON для поля {self.field_name}: {value}")
            return {} if self.field_name in ['contacts', 'legal_info', 'work_schedule'] else []
    
    def render(self, value, obj=None):
        """Преобразует JSON в строку при экспорте"""
        if value is None:
            return ''
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=False, indent=2)
        return str(value)


class AutoCreateOwnerWidget(Widget):
    """
    Виджет для автоматического создания владельца компании
    Если владелец не найден, создается суперпользователь
    """
    
    def clean(self, value, row=None, **kwargs):
        """Возвращает пользователя-владельца или создает суперпользователя"""
        if value in ('', None, 'NULL', 'null'):
            # Если владелец не указан, используем суперпользователя
            owner = User.objects.filter(is_superuser=True).first()
            if owner:
                return owner
            else:
                print("Внимание: Не найден суперпользователь для назначения владельцем компании")
                return None
        
        try:
            # Пытаемся найти пользователя по email или username
            if '@' in str(value):
                return User.objects.get(email=value)
            else:
                return User.objects.get(username=value)
        except User.DoesNotExist:
            print(f"Пользователь '{value}' не найден, используем суперпользователя")
            owner = User.objects.filter(is_superuser=True).first()
            return owner
        except Exception as e:
            print(f"Ошибка при поиске владельца '{value}': {str(e)}")
            return None
    
    def render(self, value, obj=None):
        """Отображает email владельца при экспорте"""
        if hasattr(value, 'email'):
            return value.email
        return str(value)


class CompanyResource(resources.ModelResource):
    """
    Ресурс для импорта/экспорта компаний через django-import-export
    Поддерживает только .xlsx формат с русскими заголовками
    """
    
    # Настройка полей с русскими заголовками
    id = fields.Field(
        column_name='ID',
        attribute='id',
    )
    
    name = fields.Field(
        column_name='Название',
        attribute='name',
    )
    
    phones = fields.Field(
        column_name='Номера телефонов',
        attribute='phones',
    )
    
    description = fields.Field(
        column_name='Описание', 
        attribute='description',
    )
    
    city = fields.Field(
        column_name='Город',
        attribute='city',
    )
    
    address = fields.Field(
        column_name='Адрес',
        attribute='address',
    )
    
    supplier_type = fields.Field(
        column_name='Тип поставщика',
        attribute='supplier_type',
    )
    
    # JSON поля с кастомными виджетами
    contacts = fields.Field(
        column_name='Контакты',
        attribute='contacts',
        widget=JSONWidget()
    )
    
    legal_info = fields.Field(
        column_name='Юр. информация',
        attribute='legal_info', 
        widget=JSONWidget()
    )
    
    payment_methods = fields.Field(
        column_name='Способы оплаты',
        attribute='payment_methods',
        widget=JSONWidget()
    )
    
    work_schedule = fields.Field(
        column_name='График работы',
        attribute='work_schedule',
        widget=JSONWidget()
    )
    
    status = fields.Field(
        column_name='Статус',
        attribute='status',
    )
    
    created_at = fields.Field(
        column_name='Дата создания',
        attribute='created_at',
    )
    
    # Владелец компании с автосозданием
    owner = fields.Field(
        column_name='Владелец',
        attribute='owner',
        widget=AutoCreateOwnerWidget()
    )

    class Meta:
        model = Company
        # Поля для импорта/экспорта согласно требованиям
        fields = ('id', 'name', 'phones', 'description', 'city', 'address', 
                 'supplier_type', 'contacts', 'legal_info', 'payment_methods', 
                 'work_schedule', 'status', 'owner', 'created_at')
        # Порядок экспорта колонок
        export_order = ('id', 'name', 'phones', 'description', 'city', 'address',
                       'supplier_type', 'contacts', 'legal_info', 'payment_methods',
                       'work_schedule', 'status', 'owner', 'created_at')
        # Убираем import_id_fields чтобы разрешить создание новых записей без ID
        # import_id_fields = ('id',)
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
        print(f"Обрабатываем строку компании: {dict(row)}")
        
        # Обработка поля phones - очистка лишних пробелов
        if 'Номера телефонов' in row and row['Номера телефонов']:
            phones = str(row['Номера телефонов']).strip()
            row['Номера телефонов'] = phones
        
        # Преобразование русских названий типов поставщиков в английские константы
        if 'Тип поставщика' in row and row['Тип поставщика']:
            supplier_type_mapping = {
                'Дилер': 'DEALER',
                'Производитель': 'MANUFACTURER', 
                'Торговый представитель': 'TRADE_REPRESENTATIVE',
                'DEALER': 'DEALER',
                'MANUFACTURER': 'MANUFACTURER',
                'TRADE_REPRESENTATIVE': 'TRADE_REPRESENTATIVE'
            }
            russian_type = str(row['Тип поставщика']).strip()
            if russian_type in supplier_type_mapping:
                row['Тип поставщика'] = supplier_type_mapping[russian_type]
            else:
                print(f"Неизвестный тип поставщика: {russian_type}, устанавливаем DEALER")
                row['Тип поставщика'] = 'DEALER'
        
        # Преобразование русских статусов в английские константы
        if 'Статус' in row and row['Статус']:
            status_mapping = {
                'Черновик': 'DRAFT',
                'На модерации': 'PENDING', 
                'Одобрено': 'APPROVED',
                'Заблокировано': 'BANNED',
                'DRAFT': 'DRAFT',
                'PENDING': 'PENDING',
                'APPROVED': 'APPROVED',
                'BANNED': 'BANNED'
            }
            russian_status = str(row['Статус']).strip()
            if russian_status in status_mapping:
                row['Статус'] = status_mapping[russian_status]
            else:
                print(f"Неизвестный статус: {russian_status}, устанавливаем APPROVED")
                row['Статус'] = 'APPROVED'
        else:
            # Установка статуса по умолчанию для новых компаний
            row['Статус'] = 'APPROVED'  # По умолчанию одобряем импортированные компании

    def skip_row(self, instance, original, row, import_validation_errors=None):
        """
        Определяем, нужно ли пропустить строку при импорте
        Пропускаем строки без обязательных полей
        """
        # Пропускаем строки без названия компании
        if not row.get('Название', '').strip():
            print(f"Пропускаем строку без названия: {dict(row)}")
            return True
            
        return super().skip_row(instance, original, row, import_validation_errors)

    def get_instance(self, instance_loader, row):
        """
        Получение существующего экземпляра для обновления
        Ищем по ID если он указан, иначе создаем новый
        """
        # Проверяем, есть ли ID в строке для обновления существующей записи
        if 'ID' in row and row['ID'] and str(row['ID']).strip():
            try:
                # Пытаемся найти компанию по ID
                company_id = int(row['ID'])
                return Company.objects.get(id=company_id)
            except (ValueError, Company.DoesNotExist) as e:
                print(f"Компания с ID {row['ID']} не найдена, создаем новую: {e}")
                return None
            except Exception as e:
                print(f"Ошибка при поиске компании по ID {row['ID']}: {e}")
                return None
        
        # ID не указан или пустой - создаем новую компанию
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
        
        # Проверяем, что owner установлен
        if not hasattr(instance, 'owner') or not instance.owner:
            # Назначаем суперпользователя как владельца
            owner = User.objects.filter(is_superuser=True).first()
            if owner:
                instance.owner = owner
            else:
                raise ValueError("Не найден пользователь для назначения владельцем компании")
        
        if not dry_run:
            print(f"Подготовка к сохранению компании: {instance.name} (Владелец: {instance.owner.email})")
    
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
            print(f"Успешно импортирована компания: {instance.name} (ID: {instance.id}, Владелец: {instance.owner.email})")

    def import_field(self, field, obj, data, is_m2m=False, **kwargs):
        """
        Кастомная обработка полей при импорте
        Пропускаем пустые значения без ошибок
        """
        if field.attribute and field.column_name in data:
            value = data[field.column_name]
            # Пропускаем пустые значения - оставляем текущее значение поля
            if value in ['', None, 'NULL', 'null']:
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
            row_info = f"Строка компании с данными: {dict(row)}"
            if hasattr(e, 'args') and e.args:
                e.args = (f"{e.args[0]}. {row_info}",) + e.args[1:]
            else:
                e.args = (f"Ошибка импорта компании. {row_info}",)
            raise e