from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_SEEKER = 'ROLE_SEEKER'
    ROLE_SUPPLIER = 'ROLE_SUPPLIER' 
    ROLE_ADMIN = 'ROLE_ADMIN'
    
    ROLE_CHOICES = [
        (ROLE_SEEKER, 'Seeker'),
        (ROLE_SUPPLIER, 'Supplier'),
        (ROLE_ADMIN, 'Admin'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_SEEKER)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'company']
    
    def __str__(self):
        return f"{self.user.email} -> {self.company.name}"