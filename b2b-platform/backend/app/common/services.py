import requests
from decimal import Decimal
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class CurrencyConverter:
    """Service for currency conversion using exchangerate.host API"""
    
    BASE_URL = "https://api.exchangerate.host/latest"
    CACHE_TIMEOUT = 3600  # 1 hour cache
    CACHE_KEY = "currency_rates"
    
    SUPPORTED_CURRENCIES = ['KZT', 'RUB', 'USD']
    
    @classmethod
    def _fetch_rates(cls):
        """Internal method to fetch rates from API"""
        try:
            response = requests.get(
                cls.BASE_URL,
                params={'base': 'USD'},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('success', False):
                rates = data.get('rates', {})
                # Cache the rates
                cache.set(cls.CACHE_KEY, rates, cls.CACHE_TIMEOUT)
                logger.info(f"Successfully updated currency rates: {list(rates.keys())}")
                return rates
            else:
                logger.error(f"Exchange rate API error: {data}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch exchange rates: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching exchange rates: {e}")
        
        return None
    
    @classmethod
    def get_exchange_rates(cls, base_currency='USD'):
        """Get exchange rates from cache or API"""
        rates = cache.get(cls.CACHE_KEY)
        
        if rates is not None:
            return rates
        
        # Try to fetch new rates
        rates = cls._fetch_rates()
        
        if rates is not None:
            return rates
            
        # Return fallback rates if API fails
        return cls.get_fallback_rates(base_currency)
    
    @classmethod  
    def get_fallback_rates(cls, base_currency='USD'):
        """Fallback exchange rates if API is unavailable"""
        fallback_rates = {
            'USD': {
                'KZT': 450.0,
                'RUB': 90.0,
                'USD': 1.0
            },
            'KZT': {
                'USD': 0.0022,
                'RUB': 0.20,
                'KZT': 1.0
            },
            'RUB': {
                'USD': 0.011,
                'KZT': 5.0,
                'RUB': 1.0
            }
        }
        return fallback_rates.get(base_currency, fallback_rates['USD'])
    
    @classmethod
    def convert(cls, amount, from_currency, to_currency):
        """Convert amount from one currency to another"""
        if not amount or amount <= 0:
            return Decimal('0')
            
        if from_currency == to_currency:
            return Decimal(str(amount))
            
        if from_currency not in cls.SUPPORTED_CURRENCIES or to_currency not in cls.SUPPORTED_CURRENCIES:
            logger.warning(f"Unsupported currency conversion: {from_currency} -> {to_currency}")
            return Decimal(str(amount))
            
        try:
            # Get rates with USD as base
            rates = cls.get_exchange_rates('USD')
            
            # Convert to USD first if needed
            if from_currency == 'USD':
                usd_amount = Decimal(str(amount))
            else:
                from_rate = Decimal(str(rates.get(from_currency, 1)))
                if from_rate == 0:
                    return Decimal(str(amount))
                usd_amount = Decimal(str(amount)) / from_rate
            
            # Convert from USD to target currency
            if to_currency == 'USD':
                result = usd_amount
            else:
                to_rate = Decimal(str(rates.get(to_currency, 1)))
                result = usd_amount * to_rate
                
            return result.quantize(Decimal('0.01'))
            
        except Exception as e:
            logger.error(f"Currency conversion error: {e}")
            return Decimal(str(amount))