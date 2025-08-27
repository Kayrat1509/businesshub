from django.db import models


def ad_image_upload_path(instance, filename):
    return f'ad_images/{filename}'


class Ad(models.Model):
    POSITION_CHOICES = [
        ('HOME_WIDGET', 'Home Widget'),
        ('SIDEBAR', 'Sidebar'),
        ('BANNER', 'Banner'),
    ]
    
    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to=ad_image_upload_path)
    url = models.URLField()
    position = models.CharField(max_length=20, choices=POSITION_CHOICES)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def is_current(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at


class Action(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='actions')
    title = models.CharField(max_length=200)
    description = models.TextField()
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.company.name}"
    
    @property
    def is_current(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at