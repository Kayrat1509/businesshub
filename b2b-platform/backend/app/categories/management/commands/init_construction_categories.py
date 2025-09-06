from django.core.management.base import BaseCommand
from app.categories.models import Category


class Command(BaseCommand):
    help = 'Initialize construction categories with "Другое" subcategories'

    def handle(self, *args, **options):
        # Структура категорий строительных материалов
        categories_structure = {
            "Строительство": {
                "Сантехника": [
                    "Канализация",
                    "Водопровод и отопление", 
                    "Сантехнические приборы"
                ],
                "Отделочные работы": [
                    "Лакокрасочные материалы",
                    "Гипсовые сухие смеси",
                    "Цементные сухие смеси",
                    "Напольные покрытия"
                ],
                "Строительная химия": [],
                "Электрика и освещение": [],
                "Двери и окна": [],
                "Кровельные материалы": [],
                "Утеплители и изоляция": [],
                "Фасадные материалы": [],
                "Инструменты": [],
                "Строительное оборудование": []
            }
        }
        
        created_count = 0
        
        for main_category_name, subcategories in categories_structure.items():
            # Создаем основную категорию
            main_category, created = Category.objects.get_or_create(
                name=main_category_name,
                parent=None,
                defaults={'is_active': True}
            )
            if created:
                created_count += 1
                self.stdout.write(f"✓ Создана основная категория: {main_category_name}")
            
            for sub_category_name, sub_sub_categories in subcategories.items():
                # Создаем подкатегорию
                sub_category, created = Category.objects.get_or_create(
                    name=sub_category_name,
                    parent=main_category,
                    defaults={'is_active': True}
                )
                if created:
                    created_count += 1
                    self.stdout.write(f"  ✓ Создана подкатегория: {sub_category_name}")
                
                # Создаем под-подкатегории
                for sub_sub_category_name in sub_sub_categories:
                    sub_sub_category, created = Category.objects.get_or_create(
                        name=sub_sub_category_name,
                        parent=sub_category,
                        defaults={'is_active': True}
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(f"    ✓ Создана под-подкатегория: {sub_sub_category_name}")
                
                # Добавляем "Другое" в группы с подкатегориями
                if sub_sub_categories:  # Если есть под-подкатегории
                    other_category, created = Category.objects.get_or_create(
                        name="Другое",
                        parent=sub_category,
                        defaults={'is_active': True}
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(f"    ✓ Создана категория 'Другое' в: {sub_category_name}")
            
            # Добавляем "Другое" в основную категорию
            other_main, created = Category.objects.get_or_create(
                name="Другое",
                parent=main_category,
                defaults={'is_active': True}
            )
            if created:
                created_count += 1
                self.stdout.write(f"  ✓ Создана категория 'Другое' в: {main_category_name}")
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nУспешно создано категорий: {created_count}\n'
                f'Инициализация строительных категорий завершена!'
            )
        )