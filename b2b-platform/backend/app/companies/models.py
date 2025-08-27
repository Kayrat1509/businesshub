from django.db import models
from django.contrib.auth import get_user_model
from PIL import Image
from django.core.exceptions import ValidationError
import os

User = get_user_model()


def validate_logo_size(image):
    if image:
        img = Image.open(image)
        width, height = img.size
        if width != 600 or height != 600:
            raise ValidationError('Logo must be exactly 600x600 pixels')


def logo_upload_path(instance, filename):
    return f'company_logos/{instance.id}/{filename}'


class Company(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_PENDING = 'PENDING' 
    STATUS_APPROVED = 'APPROVED'
    STATUS_BANNED = 'BANNED'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_BANNED, 'Banned'),
    ]
    
    PAYMENT_CHOICES = [
        ('CASH', 'Cash'),
        ('CARD', 'Bank Card'),
        ('TRANSFER', 'Bank Transfer'),
        ('CRYPTO', 'Cryptocurrency'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='companies')
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to=logo_upload_path, blank=True, null=True, validators=[validate_logo_size])
    description = models.TextField()
    categories = models.ManyToManyField('categories.Category', blank=True)
    
    # Contact info stored as JSON
    contacts = models.JSONField(default=dict, help_text='Phone numbers, emails, websites')
    legal_info = models.JSONField(default=dict, help_text='Legal information, INN, KPP, etc.')
    payment_methods = models.JSONField(default=list, help_text='Available payment methods')
    work_schedule = models.JSONField(default=dict, help_text='Working hours schedule')
    
    # Company details
    staff_count = models.PositiveIntegerField(default=0)
    branches_count = models.PositiveIntegerField(default=1)
    
    # Location
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    city = models.CharField(max_length=100)
    address = models.TextField()
    
    # Status and rating
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    rating = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'companies'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def update_rating(self):
        reviews = self.reviews.filter(status='APPROVED')
        if reviews.exists():
            self.rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
            self.save()


class Branch(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='branches')
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.company.name} - {self.address}"


class Employee(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    full_name = models.CharField(max_length=200)
    position = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.company.name}"