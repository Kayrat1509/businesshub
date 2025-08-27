import pytest
import tempfile
import pandas as pd
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from app.companies.models import Company
from app.categories.models import Category

User = get_user_model()


class ExcelImportTestCase(APITestCase):
    def setUp(self):
        self.supplier = User.objects.create_user(
            email='supplier@example.com',
            username='supplier',
            password='TestPass123!',
            role='ROLE_SUPPLIER'
        )
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='TestPass123!',
            role='ROLE_ADMIN'
        )

    def create_excel_file(self, data):
        """Helper method to create Excel file from data"""
        df = pd.DataFrame(data)
        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        return SimpleUploadedFile(
            'test_companies.xlsx',
            excel_buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    def test_supplier_can_import_companies(self):
        """Test that supplier can import companies"""
        self.client.force_authenticate(user=self.supplier)
        
        # Prepare test data
        test_data = [
            {
                'name': 'Import Test Company',
                'description': 'Imported company description',
                'city': 'Moscow',
                'address': 'Test Street, 1',
                'categories': 'IT|Software',
                'phone': '+7-495-123-45-67',
                'email': 'info@importtest.com',
                'staff_count': 25,
                'latitude': 55.7558,
                'longitude': 37.6176,
            }
        ]
        
        excel_file = self.create_excel_file(test_data)
        
        response = self.client.post(
            '/api/import/companies-excel/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 1)
        self.assertEqual(response.data['errors'], [])
        
        # Check company was created
        company = Company.objects.get(name='Import Test Company')
        self.assertEqual(company.owner, self.supplier)
        self.assertEqual(company.city, 'Moscow')

    def test_import_invalid_file_format(self):
        """Test import with invalid file format"""
        self.client.force_authenticate(user=self.supplier)
        
        # Create invalid file
        invalid_file = SimpleUploadedFile(
            'test.txt',
            b'Invalid content',
            content_type='text/plain'
        )
        
        response = self.client.post(
            '/api/import/companies-excel/',
            {'file': invalid_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid file format', response.data['error'])

    def test_import_missing_required_fields(self):
        """Test import with missing required fields"""
        self.client.force_authenticate(user=self.supplier)
        
        # Data missing required fields
        test_data = [
            {
                'description': 'Company without name',
                'city': 'Moscow',
            }
        ]
        
        excel_file = self.create_excel_file(test_data)
        
        response = self.client.post(
            '/api/import/companies-excel/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 0)
        self.assertEqual(response.data['skipped'], 1)
        self.assertTrue(len(response.data['errors']) > 0)

    def test_upsert_existing_company(self):
        """Test that existing companies are updated on re-import"""
        self.client.force_authenticate(user=self.supplier)
        
        # Create existing company
        Company.objects.create(
            owner=self.supplier,
            name='Existing Company',
            city='Moscow',
            description='Old description',
            address='Old Address'
        )
        
        # Import same company with updated data
        test_data = [
            {
                'name': 'Existing Company',
                'description': 'Updated description',
                'city': 'Moscow',
                'address': 'New Address',
                'staff_count': 50,
            }
        ]
        
        excel_file = self.create_excel_file(test_data)
        
        response = self.client.post(
            '/api/import/companies-excel/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 1)
        self.assertEqual(response.data['created'], 0)
        
        # Check company was updated
        company = Company.objects.get(name='Existing Company')
        self.assertEqual(company.description, 'Updated description')
        self.assertEqual(company.address, 'New Address')
        self.assertEqual(company.staff_count, 50)