from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


def tender_attachment_upload_path(instance, filename):
    return f'tender_attachments/{instance.id}/{filename}'


class Tender(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED' 
    STATUS_REJECTED = 'REJECTED'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tenders')
    title = models.CharField(max_length=200)
    description = models.TextField()
    attachments = models.JSONField(default=list, help_text='List of attachment file URLs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    categories = models.ManyToManyField('categories.Category', blank=True)
    city = models.CharField(max_length=100)
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deadline_date = models.DateField(null=True, blank=True)
    admin_comment = models.TextField(blank=True, help_text='Admin comment for rejection')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class TenderAttachment(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='tender_attachments')
    file = models.FileField(upload_to=tender_attachment_upload_path)
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Attachment for {self.tender.title}"