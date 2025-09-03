import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from app.products.models import Product


class Command(BaseCommand):
    help = 'Update all products with random ratings between 4.0 and 5.0'

    def handle(self, *args, **options):
        products = Product.objects.all()
        
        if not products.exists():
            self.stdout.write(
                self.style.WARNING('No products found in database')
            )
            return

        updated_count = 0
        
        for product in products:
            # Generate random rating between 4.0 and 5.0
            rating = round(random.uniform(4.0, 5.0), 2)
            product.rating = Decimal(str(rating))
            product.save()
            updated_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Updated {product.title} with rating {rating}')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} products with ratings between 4.0-5.0'
            )
        )