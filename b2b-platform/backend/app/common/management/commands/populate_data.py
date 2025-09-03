import random
from datetime import datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from app.categories.models import Category
from app.companies.models import Company
from app.products.models import Product
from app.tenders.models import Tender

User = get_user_model()


class Command(BaseCommand):
    help = "Populate database with sample data"

    def handle(self, *args, **options):
        self.stdout.write("Creating sample data...")

        # Create sample users
        users = self.create_users()

        # Create categories
        categories = self.create_categories()

        # Create companies
        companies = self.create_companies(users, categories)

        # Create products
        self.create_products(companies, categories)

        # Create tenders
        self.create_tenders(companies, categories)

        self.stdout.write(
            self.style.SUCCESS("Successfully populated database with sample data")
        )

    def create_users(self):
        """Create 45 sample users"""
        users = []

        # Create 10 manufacturers
        for i in range(1, 11):
            user = User.objects.create_user(
                username=f"manufacturer_{i}",
                email=f"manufacturer_{i}@example.com",
                password="password123",
                first_name=f"Производитель{i}",
                last_name="Компания",
                role="ROLE_SUPPLIER",
            )
            users.append(user)

        # Create 15 dealers
        for i in range(1, 16):
            user = User.objects.create_user(
                username=f"dealer_{i}",
                email=f"dealer_{i}@example.com",
                password="password123",
                first_name=f"Дилер{i}",
                last_name="ТОО",
                role="ROLE_SUPPLIER",
            )
            users.append(user)

        # Create 20 representatives
        for i in range(1, 21):
            user = User.objects.create_user(
                username=f"representative_{i}",
                email=f"representative_{i}@example.com",
                password="password123",
                first_name=f"Представитель{i}",
                last_name="ИП",
                role="ROLE_SUPPLIER",
            )
            users.append(user)

        self.stdout.write(f"Created {len(users)} users")
        return users

    def create_categories(self):
        """Create product categories"""
        categories_data = [
            "Сантехника",
            "Электрика",
            "Лакокрасочные материалы",
            "Кровельные материалы",
            "Железобетонные изделия",
        ]

        categories = []
        for cat_name in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_name, defaults={"slug": cat_name.lower().replace(" ", "-")}
            )
            categories.append(category)

        self.stdout.write(f"Created {len(categories)} categories")
        return categories

    def create_companies(self, users, categories):
        """Create 45 sample companies"""
        companies = []

        company_names = [
            # Производители
            "ТОО СТРОЙ-МАТЕРИАЛЫ ПЛЮС",
            "ТОО КАЗАХСТАН САНТЕХ",
            "ТОО ЭЛЕКТРО-МОНТАЖ КЗ",
            "ТОО КРАСКИ АЛМАТЫ",
            "ТОО КРОВЛЯ МАСТЕР",
            "ТОО БЕТОН-ЗАВОД НС",
            "ТОО САНТЕХ-КОМПЛЕКТ",
            "ТОО ЭЛЕКТРИКА-СЕРВИС",
            "ТОО МАТЕРИАЛЫ ПРО",
            "ТОО СТРОЙ-ИНДУСТРИЯ",
            # Дилеры
            "ТОО АДАЛ САУДА",
            "ТОО ЭЛЕКТРОКОМПЛЕКТ",
            "ТОО МАСТЕР ДОМ",
            "ТОО СТРОЙ-ДИЛЕР",
            "ТОО МАТЕРИАЛЫ ЦЕНТР",
            "ТОО САНТЕХ-ТРЕЙД",
            "ТОО ЭЛЕКТРО-ДИЛЕР",
            "ТОО КРАСКИ-СЕРВИС",
            "ТОО КРОВЛЯ-ТРЕЙД",
            "ТОО БЕТОН-ДИЛЕР",
            "ТОО СТРОЙМАТЕРИАЛЫ КЗ",
            "ТОО ЭЛЕКТРО-ЦЕНТР",
            "ТОО САНТЕХ-ПЛЮС",
            "ТОО МАТЕРИАЛЫ-ТРЕЙД",
            "ТОО СТРОЙ-КОМПЛЕКТ",
            # Торговые представители
            "ИП 220 ВОЛЬТ",
            "ИП САНТЕХ-МАСТЕР",
            "ИП СТРОЙ-ПОМОЩНИК",
            "ИП ЭЛЕКТРО-ПОМОЩЬ",
            "ИП МАТЕРИАЛЫ-СЕРВИС",
            "ИП КРОВЛЯ-ЭКСПЕРТ",
            "ИП БЕТОН-МАСТЕР",
            "ИП КРАСКИ-ПРОФИ",
            "ИП САНТЕХ-ЭКСПЕРТ",
            "ИП ЭЛЕКТРО-ПРОФИ",
            "ИП СТРОЙ-ЭКСПЕРТ",
            "ИП МАТЕРИАЛЫ-ПЛЮС",
            "ИП КРОВЛЯ-МАСТЕР",
            "ИП БЕТОН-СЕРВИС",
            "ИП ЭЛЕКТРО-МАСТЕР",
            "ИП САНТЕХ-ПРОФИ",
            "ИП КРАСКИ-МАСТЕР",
            "ИП СТРОЙ-ПРОФИ",
            "ИП МАТЕРИАЛЫ-МАСТЕР",
            "ИП КРОВЛЯ-СЕРВИС",
        ]

        cities = [
            "Алматы",
            "Нур-Султан",
            "Шымкент",
            "Караганда",
            "Актобе",
            "Тараз",
            "Павлодар",
            "Усть-Каменогорск",
        ]

        for i, user in enumerate(users):
            company = Company.objects.create(
                owner=user,
                name=company_names[i],
                description=f"Надежный поставщик строительных материалов с опытом работы более 5 лет. Предлагаем качественные товары по доступным ценам.",
                city=random.choice(cities),
                address=f"ул. Строительная, {random.randint(1, 200)}",
                status=Company.STATUS_APPROVED,
                rating=round(random.uniform(4.0, 5.0), 1),
                staff_count=random.randint(5, 50),
                contacts={
                    "phone": f"+7 (7{random.randint(10, 99)}) {random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
                    "email": f'info@{company_names[i].lower().replace(" ", "").replace("тоо", "").replace("ип", "")}.kz',
                    "website": f'https://{company_names[i].lower().replace(" ", "").replace("тоо", "").replace("ип", "")}.kz',
                },
                legal_info={
                    "inn": f"{random.randint(100000000000, 999999999999)}",
                    "legal_address": f"г. {random.choice(cities)}, ул. Юридическая, {random.randint(1, 100)}",
                },
                payment_methods=["CASH", "CARD", "TRANSFER"],
                work_schedule={
                    "monday": "09:00-18:00",
                    "tuesday": "09:00-18:00",
                    "wednesday": "09:00-18:00",
                    "thursday": "09:00-18:00",
                    "friday": "09:00-18:00",
                    "saturday": "10:00-16:00",
                    "sunday": "Выходной",
                },
            )

            # Assign 1-3 random categories to each company
            company_categories = random.sample(categories, random.randint(1, 3))
            company.categories.set(company_categories)

            companies.append(company)

        self.stdout.write(f"Created {len(companies)} companies")
        return companies

    def create_products(self, companies, categories):
        """Create sample products for companies"""
        product_templates = {
            "Сантехника": [
                "Смеситель для кухни",
                "Унитаз напольный",
                "Ванна акриловая",
                "Душевая кабина",
                "Раковина керамическая",
                "Полотенцесушитель",
                "Трубы ПВХ",
                "Фитинги",
                "Сифон для раковины",
                "Гибкая подводка",
            ],
            "Электрика": [
                "Кабель ВВГ",
                "Автоматический выключатель",
                "Розетка с заземлением",
                "Выключатель одноклавишный",
                "Светильник LED",
                "Лампа энергосберегающая",
                "Щиток электрический",
                "УЗО",
                "Счетчик электроэнергии",
                "Гофра для кабеля",
            ],
            "Лакокрасочные материалы": [
                "Краска водоэмульсионная",
                "Эмаль ПФ-115",
                "Грунтовка универсальная",
                "Лак паркетный",
                "Шпатлевка финишная",
                "Антисептик для дерева",
                "Краска для металла",
                "Растворитель 646",
                "Кисть малярная",
                "Валик меховой",
            ],
            "Кровельные материалы": [
                "Металлочерепица",
                "Профнастил оцинкованный",
                "Гибкая черепица",
                "Водосточная система",
                "Утеплитель кровельный",
                "Пароизоляция",
                "Мембрана супердиффузионная",
                "Саморезы кровельные",
                "Конек металлический",
                "Снегозадержатель",
            ],
            "Железобетонные изделия": [
                "Плита перекрытия ПК",
                "Блок фундаментный ФБС",
                "Кольца железобетонные",
                "Плита дорожная ПД",
                "Столб железобетонный",
                "Балка таврового сечения",
                "Лестничный марш",
                "Блок вентиляционный",
                "Перемычка оконная",
                "Колонна железобетонная",
            ],
        }

        products_count = 0
        for company in companies:
            # Each company gets 3-8 products
            num_products = random.randint(3, 8)
            company_categories = company.categories.all()

            for _ in range(num_products):
                category = random.choice(company_categories)
                product_name = random.choice(product_templates[category.name])

                product = Product.objects.create(
                    company=company,
                    title=product_name,
                    description=f"Качественный {product_name.lower()} от надежного поставщика. Соответствует всем стандартам качества.",
                    category=category,
                    price=Decimal(str(random.randint(500, 50000))),
                    currency="RUB",
                    is_service=False,
                    in_stock=random.choice([True, False]),
                    is_active=True,
                )
                products_count += 1

        self.stdout.write(f"Created {products_count} products")

    def create_tenders(self, companies, categories):
        """Create 24 sample tenders"""
        tender_templates = {
            "Сантехника": [
                {"name": "Смесители для офиса", "quantity": 25, "unit": "шт"},
                {"name": "Унитазы для торгового центра", "quantity": 15, "unit": "шт"},
                {"name": "Раковины керамические", "quantity": 30, "unit": "шт"},
                {"name": "Трубы ПВХ 110мм", "quantity": 500, "unit": "м"},
            ],
            "Электрика": [
                {"name": "Кабель ВВГ 3x2.5", "quantity": 1000, "unit": "м"},
                {"name": "Автоматы 16А", "quantity": 50, "unit": "шт"},
                {"name": "Светильники LED офисные", "quantity": 100, "unit": "шт"},
                {"name": "Розетки с заземлением", "quantity": 200, "unit": "шт"},
            ],
            "Лакокрасочные материалы": [
                {"name": "Краска фасадная белая", "quantity": 200, "unit": "л"},
                {
                    "name": "Грунтовка глубокого проникновения",
                    "quantity": 100,
                    "unit": "л",
                },
                {"name": "Эмаль ПФ-115 серая", "quantity": 50, "unit": "кг"},
                {"name": "Шпатлевка финишная", "quantity": 500, "unit": "кг"},
            ],
            "Кровельные материалы": [
                {"name": "Металлочерепица красная", "quantity": 300, "unit": "м²"},
                {"name": "Профнастил С-21", "quantity": 500, "unit": "м²"},
                {"name": "Утеплитель кровельный", "quantity": 200, "unit": "м²"},
                {"name": "Водосточная система", "quantity": 10, "unit": "компл"},
            ],
            "Железобетонные изделия": [
                {"name": "Плиты перекрытия ПК 60-15", "quantity": 20, "unit": "шт"},
                {"name": "Блоки ФБС 24-4-6", "quantity": 50, "unit": "шт"},
                {"name": "Кольца КС 15-9", "quantity": 10, "unit": "шт"},
                {"name": "Плиты дорожные 3х1.5м", "quantity": 100, "unit": "шт"},
            ],
        }

        cities = ["Алматы", "Нур-Султан", "Шымкент", "Караганда", "Актобе"]

        tenders_count = 0
        for category in categories:
            # 4-5 tenders per category to get close to 24 total
            num_tenders = 5 if tenders_count < 20 else 4
            category_tenders = tender_templates[category.name]

            for i in range(min(num_tenders, len(category_tenders))):
                tender_data = category_tenders[i]
                company = random.choice(companies)

                tender = Tender.objects.create(
                    author=company.owner,
                    title=f'Требуется: {tender_data["name"]} - {tender_data["quantity"]} {tender_data["unit"]}',
                    description=f'Ищем надежного поставщика {tender_data["name"].lower()} для нашего объекта. Требуется качественная продукция с гарантией. Количество: {tender_data["quantity"]} {tender_data["unit"]}. Срок поставки: {random.randint(10, 30)} дней.',
                    city=random.choice(cities),
                    budget_min=Decimal(
                        str(tender_data["quantity"] * random.randint(100, 500))
                    ),
                    budget_max=Decimal(
                        str(tender_data["quantity"] * random.randint(600, 1000))
                    ),
                    deadline_date=datetime.now().date()
                    + timedelta(days=random.randint(10, 60)),
                    status=Tender.STATUS_APPROVED,
                )

                # Add category to the tender
                tender.categories.add(category)
                tenders_count += 1

        self.stdout.write(f"Created {tenders_count} tenders")
