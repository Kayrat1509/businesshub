import re

from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            # Create a better slug for Cyrillic characters
            base_slug = slugify(self.name, allow_unicode=True)
            if not base_slug:  # Fallback if slugify returns empty
                base_slug = re.sub(r"[^\w\s-]", "", self.name.lower())
                base_slug = re.sub(r"[\s_-]+", "-", base_slug).strip("-")
                if not base_slug:
                    base_slug = f'category-{self.pk or "new"}'

            # Ensure uniqueness
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_full_path(self):
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return " > ".join(path)
