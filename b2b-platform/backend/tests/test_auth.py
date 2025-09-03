import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthTestCase(APITestCase):
    def setUp(self):
        self.register_url = reverse('user-register')
        self.login_url = reverse('token-obtain-pair')
        
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'role': 'ROLE_SEEKER',
            'first_name': 'Test',
            'last_name': 'User',
        }

    def test_user_registration(self):
        """Test user registration"""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', response.data)
        self.assertIn('username', response.data)
        self.assertIn('role', response.data)
        
        # Check user was created
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())

    def test_user_login(self):
        """Test user login"""
        # First create a user
        user = User.objects.create_user(
            email=self.user_data['email'],
            username=self.user_data['username'],
            password=self.user_data['password'],
            role=self.user_data['role']
        )
        
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_invalid_registration(self):
        """Test registration with invalid data"""
        invalid_data = self.user_data.copy()
        invalid_data['password_confirm'] = 'DifferentPassword'
        
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_registration(self):
        """Test registration with existing email"""
        # Create first user
        User.objects.create_user(
            email=self.user_data['email'],
            username='existinguser',
            password=self.user_data['password']
        )
        
        # Try to register with same email
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)