from django.db import models
from decimal import Decimal


def product_image_upload_path(instance, filename):
    return f"product_images/{instance.product.company.id}/{filename}"


class Product(models.Model):
    CURRENCY_CHOICES = [
        ("KZT", "Kazakhstani Tenge"),
        ("RUB", "Russian Ruble"),
        ("USD", "US Dollar"),
    ]

    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="products"
    )
    title = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="KZT")
    is_service = models.BooleanField(default=False)
    category = models.ForeignKey(
        "categories.Category", on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    image = models.ImageField(upload_to="products/", null=True, blank=True, help_text="Основное изображение товара")
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
    
    def get_price_in(self, target_currency):
        """Convert price to target currency"""
        if not self.price:
            return None
            
        # Temporary simple conversion with fallback rates
        rates = {'KZT': Decimal('450.0'), 'RUB': Decimal('90.0'), 'USD': Decimal('1.0')}
        if self.currency == target_currency:
            return self.price
        
        usd_amount = self.price / rates.get(self.currency, Decimal('1'))
        converted_price = usd_amount * rates.get(target_currency, Decimal('1'))
        return round(converted_price, 2)
    
    def get_price_display_with_conversions(self):
        """Get price display with all currency conversions"""
        if not self.price:
            return "Договорная"
        
        displays = [f"{self.price} {self.currency}"]
        
        for currency in ['KZT', 'RUB', 'USD']:
            if currency != self.currency:
                converted = self.get_price_in(currency)
                if converted:
                    displays.append(f"{converted} {currency}")
        
        return " | ".join(displays)


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


