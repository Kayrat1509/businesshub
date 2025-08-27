from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from app.categories.models import Category
from app.companies.models import Company
from app.products.models import Product
from app.reviews.models import Review
from app.tenders.models import Tender
from app.ads.models import Ad, Action

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo data for the B2B platform'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo data...')

        # Create demo users
        self.create_demo_users()
        
        # Create categories
        self.create_categories()
        
        # Create companies
        self.create_companies()
        
        # Create products
        self.create_products()
        
        # Create reviews
        self.create_reviews()
        
        # Create tenders
        self.create_tenders()
        
        # Create ads
        self.create_ads()

        self.stdout.write(
            self.style.SUCCESS('Successfully created demo data!')
        )

    def create_demo_users(self):
        """Create demo users"""
        users_data = [
            {
                'email': 'admin@example.com',
                'username': 'admin',
                'password': 'Admin123!',
                'role': 'ROLE_ADMIN',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'supplier@example.com',
                'username': 'supplier',
                'password': 'Supplier123!',
                'role': 'ROLE_SUPPLIER',
                'first_name': 'Supplier',
                'last_name': 'User',
            },
            {
                'email': 'seeker@example.com',
                'username': 'seeker',
                'password': 'Seeker123!',
                'role': 'ROLE_SEEKER',
                'first_name': 'Seeker',
                'last_name': 'User',
            },
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'Created user: {user.email}')

    def create_categories(self):
        """Create demo categories"""
        categories_data = [
            {'name': 'IT и программирование', 'parent': None},
            {'name': 'Веб-разработка', 'parent': 'IT и программирование'},
            {'name': 'Мобильная разработка', 'parent': 'IT и программирование'},
            {'name': 'Строительство', 'parent': None},
            {'name': 'Отделочные работы', 'parent': 'Строительство'},
            {'name': 'Производство', 'parent': None},
            {'name': 'Пищевая промышленность', 'parent': 'Производство'},
            {'name': 'Услуги', 'parent': None},
            {'name': 'Консультирование', 'parent': 'Услуги'},
            {'name': 'Торговля', 'parent': None},
        ]

        created_categories = {}
        for cat_data in categories_data:
            parent = None
            if cat_data['parent']:
                parent = created_categories.get(cat_data['parent'])
            
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'parent': parent, 'is_active': True}
            )
            created_categories[cat_data['name']] = category
            
            if created:
                self.stdout.write(f'Created category: {category.name}')

    def create_companies(self):
        """Create demo companies"""
        suppliers = User.objects.filter(role='ROLE_SUPPLIER')
        if not suppliers:
            return

        companies_data = [
            {
                'name': 'ТехРешения ООО',
                'description': 'Разработка веб-приложений и мобильных решений',
                'city': 'Москва',
                'address': 'ул. Ленина, д. 10',
                'latitude': 55.7558,
                'longitude': 37.6176,
                'status': 'APPROVED',
                'staff_count': 25,
            },
            {
                'name': 'СтройКомплект',
                'description': 'Поставка строительных материалов и отделочных работ',
                'city': 'Санкт-Петербург',
                'address': 'Невский проспект, д. 50',
                'latitude': 59.9311,
                'longitude': 30.3609,
                'status': 'APPROVED',
                'staff_count': 50,
            },
        ]

        categories = list(Category.objects.all())
        
        for i, company_data in enumerate(companies_data):
            supplier = suppliers[i % len(suppliers)]
            
            company, created = Company.objects.get_or_create(
                name=company_data['name'],
                owner=supplier,
                defaults={
                    **company_data,
                    'contacts': {
                        'phones': ['+7-495-123-45-67'],
                        'emails': ['info@company.com'],
                        'website': 'https://company.com'
                    },
                    'rating': round(random.uniform(3.5, 5.0), 1),
                }
            )
            
            if created:
                # Add random categories
                company.categories.set(random.sample(categories, k=random.randint(1, 3)))
                company.update_rating()
                self.stdout.write(f'Created company: {company.name}')

    def create_products(self):
        """Create demo products"""
        companies = Company.objects.filter(status='APPROVED')
        categories = list(Category.objects.all())
        
        products_data = [
            {'title': 'Разработка веб-сайта', 'price': 50000, 'is_service': True},
            {'title': 'Мобильное приложение iOS', 'price': 80000, 'is_service': True},
            {'title': 'Цемент М400', 'price': 5000, 'is_service': False},
            {'title': 'Кирпич красный', 'price': 12, 'is_service': False},
        ]
        
        for company in companies:
            for prod_data in random.sample(products_data, k=2):
                Product.objects.get_or_create(
                    title=prod_data['title'],
                    company=company,
                    defaults={
                        'description': f'Качественный продукт от {company.name}',
                        'price': prod_data['price'],
                        'currency': 'RUB',
                        'is_service': prod_data['is_service'],
                        'category': random.choice(categories),
                        'in_stock': True,
                        'is_active': True,
                    }
                )

    def create_reviews(self):
        """Create demo reviews"""
        companies = Company.objects.filter(status='APPROVED')
        seekers = User.objects.filter(role='ROLE_SEEKER')
        
        if not seekers:
            return
            
        reviews_texts = [
            'Отличная компания, рекомендую!',
            'Качественные услуги, быстрая доставка.',
            'Хорошее соотношение цена-качество.',
            'Профессиональный подход к работе.',
        ]
        
        for company in companies:
            for _ in range(random.randint(2, 5)):
                seeker = random.choice(seekers)
                Review.objects.get_or_create(
                    company=company,
                    author=seeker,
                    defaults={
                        'rating': random.randint(3, 5),
                        'text': random.choice(reviews_texts),
                        'status': 'APPROVED',
                    }
                )

    def create_tenders(self):
        """Create demo tenders"""
        seekers = User.objects.filter(role='ROLE_SEEKER')
        categories = list(Category.objects.all())
        
        if not seekers:
            return
            
        tenders_data = [
            {
                'title': 'Разработка корпоративного сайта',
                'description': 'Требуется разработка корпоративного сайта с админ-панелью',
                'city': 'Москва',
                'budget_min': 30000,
                'budget_max': 50000,
            },
            {
                'title': 'Поставка строительных материалов',
                'description': 'Нужны стройматериалы для строительства офисного здания',
                'city': 'Санкт-Петербург',
                'budget_min': 100000,
                'budget_max': 200000,
            },
        ]
        
        for tender_data in tenders_data:
            seeker = random.choice(seekers)
            tender, created = Tender.objects.get_or_create(
                title=tender_data['title'],
                author=seeker,
                defaults={
                    **tender_data,
                    'status': 'APPROVED',
                    'deadline_date': timezone.now().date() + timedelta(days=30),
                }
            )
            
            if created:
                tender.categories.set(random.sample(categories, k=2))

    def create_ads(self):
        """Create demo ads"""
        Ad.objects.get_or_create(
            title='Реклама 1',
            defaults={
                'image': 'ad_images/ad1.jpg',
                'url': 'https://example.com',
                'position': 'HOME_WIDGET',
                'is_active': True,
                'starts_at': timezone.now(),
                'ends_at': timezone.now() + timedelta(days=30),
            }
        )
        
        # Create actions for companies
        companies = Company.objects.filter(status='APPROVED')
        for company in companies:
            Action.objects.get_or_create(
                company=company,
                title=f'Скидка 20% от {company.name}',
                defaults={
                    'description': 'Специальное предложение для новых клиентов',
                    'is_active': True,
                    'starts_at': timezone.now(),
                    'ends_at': timezone.now() + timedelta(days=15),
                }
            )