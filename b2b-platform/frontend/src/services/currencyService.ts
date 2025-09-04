import { apiService } from './apiService';

export interface ExchangeRates {
  [currency: string]: number;
}

export interface ExchangeRateResponse {
  success: boolean;
  base: string;
  date: string;
  rates: ExchangeRates;
}

export interface ConvertPriceRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

export interface ConvertPriceResponse {
  success: boolean;
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  error?: string;
}

class CurrencyService {
  private rates: ExchangeRates | null = null;
  private lastFetch: number = 0;
  private readonly SUPPORTED_CURRENCIES = ['KZT', 'RUB', 'USD'];
  
  // Cache duration is longer since we update on schedule
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
  
  // Scheduled update times (in hours, 24-hour format)
  private readonly UPDATE_HOURS = [9, 14, 19];

  constructor() {
    // Check if we need to fetch rates on initialization
    this.initializeRates();
  }

  private async initializeRates(): Promise<void> {
    try {
      // Try to load rates if cache is empty or expired
      if (!this.rates || this.shouldFetchNewRates()) {
        await this.fetchRates();
      }
    } catch (error) {
      console.warn('Failed to initialize currency rates:', error);
    }
  }

  private shouldFetchNewRates(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Always fetch if we don't have rates or cache is very old
    if (!this.rates || (Date.now() - this.lastFetch) > this.CACHE_DURATION) {
      return true;
    }
    
    // Check if we're at a scheduled update time and haven't fetched recently
    const isScheduledTime = this.UPDATE_HOURS.includes(currentHour);
    const timeSinceLastFetch = Date.now() - this.lastFetch;
    const oneHour = 60 * 60 * 1000;
    
    return isScheduledTime && timeSinceLastFetch > oneHour;
  }

  async fetchRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    try {
      console.log(`Fetching exchange rates with base currency: ${baseCurrency}`);
      
      // Fetch from external API (exchangerate.host)
      const response = await apiService.getExternal<ExchangeRateResponse>(
        `https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=${this.SUPPORTED_CURRENCIES.join(',')}`
      );
      
      if (response.success && response.rates) {
        this.rates = response.rates;
        this.lastFetch = Date.now();
        
        // Store in localStorage for persistence
        localStorage.setItem('currency_rates', JSON.stringify({
          rates: this.rates,
          lastFetch: this.lastFetch,
          base: baseCurrency
        }));
        
        console.log('Exchange rates updated successfully:', this.rates);
        return this.rates;
      } else {
        throw new Error('Invalid response from exchange rate API');
      }
    } catch (error) {
      console.error('Error fetching exchange rates from external API:', error);
      
      // Fallback to backend API
      try {
        const backendResponse = await apiService.get<any>('/products/exchange-rates/');
        if (backendResponse.success && backendResponse.rates) {
          this.rates = backendResponse.rates;
          this.lastFetch = Date.now();
          return this.rates!;
        }
      } catch (backendError) {
        console.error('Backend API also failed:', backendError);
      }
      
      // Load from localStorage if available
      const stored = this.loadFromStorage();
      if (stored) {
        console.log('Using stored exchange rates');
        return stored;
      }
      
      // Final fallback to hardcoded rates
      console.warn('Using fallback exchange rates');
      return this.getFallbackRates();
    }
  }

  private loadFromStorage(): ExchangeRates | null {
    try {
      const stored = localStorage.getItem('currency_rates');
      if (stored) {
        const data = JSON.parse(stored);
        const age = Date.now() - data.lastFetch;
        
        // Use stored rates if less than 12 hours old
        if (age < 12 * 60 * 60 * 1000) {
          this.rates = data.rates;
          this.lastFetch = data.lastFetch;
          return data.rates;
        }
      }
    } catch (error) {
      console.error('Error loading rates from storage:', error);
    }
    return null;
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    // Return cached rates if still valid
    if (this.rates && !this.shouldFetchNewRates()) {
      return this.rates;
    }

    // Fetch new rates
    return await this.fetchRates();
  }

  private getFallbackRates(): ExchangeRates {
    const fallbackRates = {
      KZT: 450.0,
      RUB: 90.0,
      USD: 1.0
    };
    
    this.rates = fallbackRates;
    this.lastFetch = Date.now();
    return fallbackRates;
  }

  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (!amount || amount <= 0) return 0;
    if (fromCurrency === toCurrency) return amount;

    // Validate currencies
    if (!this.SUPPORTED_CURRENCIES.includes(fromCurrency) || 
        !this.SUPPORTED_CURRENCIES.includes(toCurrency)) {
      console.warn(`Unsupported currency conversion: ${fromCurrency} -> ${toCurrency}`);
      return amount;
    }

    try {
      const rates = await this.getExchangeRates();
      
      // Convert to USD first if needed
      let usdAmount = amount;
      if (fromCurrency !== 'USD') {
        const fromRate = rates[fromCurrency];
        if (!fromRate || fromRate === 0) {
          console.warn(`No rate found for ${fromCurrency}`);
          return amount;
        }
        usdAmount = amount / fromRate;
      }

      // Convert from USD to target currency
      if (toCurrency === 'USD') {
        return Math.round(usdAmount * 100) / 100;
      } else {
        const toRate = rates[toCurrency];
        if (!toRate) {
          console.warn(`No rate found for ${toCurrency}`);
          return amount;
        }
        const convertedAmount = usdAmount * toRate;
        return Math.round(convertedAmount * 100) / 100;
      }
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount if conversion fails
    }
  }

  // Alias for backward compatibility
  async convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    return this.convert(amount, fromCurrency, toCurrency);
  }

  async convertPriceViaAPI(request: ConvertPriceRequest): Promise<ConvertPriceResponse> {
    try {
      const response = await apiService.post<ConvertPriceResponse>('/products/convert-price/', request);
      return response;
    } catch (error) {
      console.error('Error converting price via API:', error);
      throw error;
    }
  }

  // Force refresh rates (clears cache and fetches new rates)
  async refreshRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    this.clearCache();
    return await this.fetchRates(baseCurrency);
  }

  // Clear cached rates
  clearCache(): void {
    this.rates = null;
    this.lastFetch = 0;
    localStorage.removeItem('currency_rates');
  }

  // Get supported currencies
  getSupportedCurrencies(): string[] {
    return [...this.SUPPORTED_CURRENCIES];
  }

  // Get cache info
  getCacheInfo(): { hasRates: boolean; lastFetch: number; age: number } {
    return {
      hasRates: !!this.rates,
      lastFetch: this.lastFetch,
      age: this.lastFetch ? Date.now() - this.lastFetch : 0
    };
  }

  // Check if rates are fresh (within scheduled update window)
  areRatesFresh(): boolean {
    if (!this.rates) return false;
    const age = Date.now() - this.lastFetch;
    return age < this.CACHE_DURATION;
  }
}

export const currencyService = new CurrencyService();
export default currencyService;