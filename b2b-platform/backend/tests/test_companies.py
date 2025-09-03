import pytest
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from app.companies.models import Company
from app.categories.models import Category

User = get_user_model()


class CompanyTestCase(APITestCase):
    def setUp(self):
        self.supplier = User.objects.create_user(
            email='supplier@example.com',
            username='supplier',
            password='TestPass123!',
            role='ROLE_SUPPLIER'
        )
        
        self.seeker = User.objects.create_user(
            email='seeker@example.com',
            username='seeker',
            password='TestPass123!',
            role='ROLE_SEEKER'
        )
        
        self.category = Category.objects.create(
            name='Test Category',
            is_active=True
        )
        
        self.company_data = {
            'name': 'Test Company',
            'description': 'Test company description',
            'city': 'Test City',
            'address': 'Test Address',
            'staff_count': 10,
            'categories': [self.category.id],
            'contacts': {
                'phones': ['+7-999-123-45-67'],
                'emails': ['test@company.com']
            }
        }

    def test_supplier_can_create_company(self):
        """Test that supplier can create a company"""
        self.client.force_authenticate(user=self.supplier)
        
        response = self.client.post('/api/companies/', self.company_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Company.objects.count(), 1)
        
        company = Company.objects.first()
        self.assertEqual(company.owner, self.supplier)
        self.assertEqual(company.name, self.company_data['name'])

    def test_seeker_cannot_create_company(self):
        """Test that seeker cannot create a company"""
        self.client.force_authenticate(user=self.seeker)
        
        response = self.client.post('/api/companies/', self.company_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_can_view_companies(self):
        """Test that unauthenticated users can view approved companies"""
        # Create approved company
        company = Company.objects.create(
            owner=self.supplier,
            name='Public Company',
            description='Public description',
            city='Test City',
            address='Test Address',
            status='APPROVED'
        )
        
        response = self.client.get('/api/companies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_supplier_can_only_edit_own_company(self):
        """Test that supplier can only edit their own company"""
        # Create company owned by supplier
        company = Company.objects.create(
            owner=self.supplier,
            name='My Company',
            description='My description',
            city='Test City',
            address='Test Address'
        )
        
        # Create another supplier
        other_supplier = User.objects.create_user(
            email='other@example.com',
            username='other',
            password='TestPass123!',
            role='ROLE_SUPPLIER'
        )
        
        # Try to edit as other supplier
        self.client.force_authenticate(user=other_supplier)
        response = self.client.patch(f'/api/companies/{company.id}/', {'name': 'Hacked'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Edit as owner
        self.client.force_authenticate(user=self.supplier)
        response = self.client.patch(f'/api/companies/{company.id}/', {'name': 'Updated Name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        company.refresh_from_db()
        self.assertEqual(company.name, 'Updated Name')