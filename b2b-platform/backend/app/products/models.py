from django.db import models


def product_image_upload_path(instance, filename):
    return f"product_images/{instance.company.id}/{filename}"


class Product(models.Model):
    CURRENCY_CHOICES = [
        ("RUB", "Russian Ruble"),
        ("USD", "US Dollar"),
        ("EUR", "Euro"),
    ]

    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="products"
    )
    title = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="RUB")
    is_service = models.BooleanField(default=False)
    category = models.ForeignKey(
        "categories.Category", on_delete=models.SET_NULL, null=True, blank=True
    )
    images = models.JSONField(default=list, help_text="List of image URLs")
    in_stock = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.5, help_text="Product rating from 4.0 to 5.0")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.company.name}"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="product_images"
    )
    image = models.ImageField(upload_to=product_image_upload_path)
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "created_at"]

    def __str__(self):
        return f"Image for {self.product.title}"
