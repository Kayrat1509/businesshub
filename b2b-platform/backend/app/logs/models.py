from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ActionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='action_logs')
    action = models.CharField(max_length=200, help_text='Action description')
    entity_type = models.CharField(max_length=50, help_text='Type of entity affected')
    entity_id = models.PositiveIntegerField(null=True, blank=True, help_text='ID of affected entity')
    payload = models.JSONField(default=dict, help_text='Additional action data')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['entity_type', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.created_at}"