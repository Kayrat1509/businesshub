from rest_framework import serializers

from app.categories.serializers import CategorySerializer

from .models import Branch, Company, Employee


class CompanyProductSerializer(serializers.Serializer):
    """Simplified serializer for products in company cards"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    currency = serializers.CharField()
    is_service = serializers.BooleanField()
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Truncate description to 4 lines (approximately 200 chars)
        if data['description'] and len(data['description']) > 200:
            data['description'] = data['description'][:200] + '...'
        return data


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "address", "latitude", "longitude", "phone", "created_at"]


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ["id", "full_name", "position", "phone", "email", "created_at"]


class CompanyListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    is_favorite = serializers.SerializerMethodField()
    staff_count = serializers.IntegerField()
    reviews_count = serializers.SerializerMethodField()
    products = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "logo",
            "description",
            "categories",
            "supplier_type",
            "city",
            "rating",
            "status",
            "owner_name",
            "is_favorite",
            "staff_count",
            "reviews_count",
            "products",
            "created_at",
        ]

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from app.users.models import Favorite
            return Favorite.objects.filter(user=request.user, company=obj).exists()
        return False

    def get_reviews_count(self, obj):
        return obj.reviews.filter(status="APPROVED").count()
    
    def get_products(self, obj):
        # Get first 4 active products for the company card
        products = obj.products.filter(is_active=True)[:4]
        return CompanyProductSerializer(products, many=True).data


class CompanyDetailSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    branches = BranchSerializer(many=True, read_only=True)
    employees = EmployeeSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    is_favorite = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "logo",
            "description",
            "categories",
            "supplier_type",
            "contacts",
            "legal_info",
            "payment_methods",
            "work_schedule",
            "staff_count",
            "branches_count",
            "latitude",
            "longitude",
            "city",
            "address",
            "status",
            "rating",
            "owner_name",
            "is_favorite",
            "reviews_count",
            "branches",
            "employees",
            "created_at",
            "updated_at",
        ]

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from app.users.models import Favorite
            return Favorite.objects.filter(user=request.user, company=obj).exists()
        return False

    def get_reviews_count(self, obj):
        return obj.reviews.filter(status="APPROVED").count()


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "logo",
            "description",
            "categories",
            "supplier_type",
            "contacts",
            "legal_info",
            "payment_methods",
            "work_schedule",
            "staff_count",
            "branches_count",
            "latitude",
            "longitude",
            "city",
            "address",
            "status",
            "rating",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "rating", "created_at", "updated_at"]

    def create(self, validated_data):
        from django.core.mail import send_mail
        from django.conf import settings

        categories = validated_data.pop("categories", [])

        # Синхронизируем контакты в обеих форматах перед созданием
        contacts = validated_data.get('contacts', {})
        validated_data['contacts'] = self._sync_contacts(contacts)

        company = Company.objects.create(**validated_data)
        company.categories.set(categories)

        # Send email notification to the company owner
        try:
            owner = company.owner
            subject = f'Компания "{company.name}" успешно создана'
            message = f"""
            Здравствуйте, {owner.get_full_name() or owner.username}!

            Ваша компания "{company.name}" была успешно создана в системе B2B Platform.

            Основная информация:
            • Название: {company.name}
            • Город: {company.city}
            • Адрес: {company.address}
            • Статус: {company.get_status_display()}

            Теперь вы можете добавлять товары и услуги в свой каталог.

            С уважением,
            Команда B2B Platform
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@b2bplatform.com'),
                recipient_list=[owner.email],
                fail_silently=True,  # Don't fail if email sending fails
            )
        except Exception as e:
            # Log email error but don't fail the company creation
            print(f"Failed to send company creation email: {e}")

        return company

    def update(self, instance, validated_data):
        categories = validated_data.pop("categories", None)

        # Синхронизируем контакты в обеих форматах перед обновлением
        if 'contacts' in validated_data:
            contacts = validated_data['contacts']
            validated_data['contacts'] = self._sync_contacts(contacts)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories is not None:
            instance.categories.set(categories)

        return instance

    def _sync_contacts(self, contacts):
        """
        Синхронизирует контакты в обеих форматах для совместимости
        между личным кабинетом (одинарные поля) и админкой (массивы)
        """
        if not contacts:
            contacts = {}

        # Собираем все телефоны из разных источников
        all_phones = []

        # Добавляем одинарный телефон из contacts.phone
        if contacts.get('phone'):
            all_phones.append(contacts['phone'])

        # Добавляем массив телефонов из contacts.phones
        if contacts.get('phones') and isinstance(contacts['phones'], list):
            for phone in contacts['phones']:
                if phone and phone not in all_phones:  # Избегаем дублирования
                    all_phones.append(phone)

        # Собираем все email адреса из разных источников
        all_emails = []

        # Добавляем одинарный email из contacts.email
        if contacts.get('email'):
            all_emails.append(contacts['email'])

        # Добавляем массив emails из contacts.emails
        if contacts.get('emails') and isinstance(contacts['emails'], list):
            for email in contacts['emails']:
                if email and email not in all_emails:  # Избегаем дублирования
                    all_emails.append(email)

        # Сохраняем контакты в обеих форматах
        synced_contacts = {
            'phones': all_phones,  # Массив для админки
            'emails': all_emails,  # Массив для админки
            'website': contacts.get('website', ''),
            'social': contacts.get('social', {})
        }

        # Добавляем одинарные поля для совместимости с личным кабинетом
        if all_phones:
            synced_contacts['phone'] = all_phones[0]  # Первый телефон как основной
        if all_emails:
            synced_contacts['email'] = all_emails[0]  # Первый email как основной

        return synced_contacts
