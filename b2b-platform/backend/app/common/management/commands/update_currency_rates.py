from django.core.management.base import BaseCommand
from django.core.cache import cache
from app.common.services import CurrencyConverter
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update currency rates from external API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update even if cache is not expired',
        )

    def handle(self, *args, **options):
        try:
            self.stdout.write('Starting currency rates update...')
            
            # Clear cache if force update is requested
            if options['force']:
                cache.delete('currency_rates')
                self.stdout.write('Cleared cached rates')
            
            # Trigger rates update by calling the converter
            rates = CurrencyConverter._fetch_rates()
            
            if rates:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully updated currency rates: {list(rates.keys())}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Failed to fetch rates, using fallback rates')
                )
                
        except Exception as e:
            logger.error(f'Error updating currency rates: {e}')
            self.stdout.write(
                self.style.ERROR(f'Error updating currency rates: {e}')
            )