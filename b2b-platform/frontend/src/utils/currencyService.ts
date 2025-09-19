// Сервис для работы с курсами валют через API open.er-api.com
interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: {
    [key: string]: number;
  };
}

interface CachedRates {
  rates: { [key: string]: number };
  timestamp: number;
  baseCurrency: string;
}

// Время кеширования - 4 часа в миллисекундах
const CACHE_DURATION = 4 * 60 * 60 * 1000;

// Ключ для хранения в localStorage
const CACHE_KEY_PREFIX = 'exchange_rates_';

/**
 * Получает курсы валют из кеша localStorage
 */
function getCachedRates(baseCurrency: string): CachedRates | null {
  try {
    const cacheKey = CACHE_KEY_PREFIX + baseCurrency;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const parsedCache: CachedRates = JSON.parse(cached);
    const now = Date.now();

    // Проверяем, не истёк ли кеш
    if (now - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsedCache;
  } catch (error) {
    console.error('Ошибка чтения кеша курсов валют:', error);
    return null;
  }
}

/**
 * Сохраняет курсы валют в кеш localStorage
 */
function setCachedRates(baseCurrency: string, rates: { [key: string]: number }): void {
  try {
    const cacheKey = CACHE_KEY_PREFIX + baseCurrency;
    const cacheData: CachedRates = {
      rates,
      timestamp: Date.now(),
      baseCurrency
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Ошибка сохранения кеша курсов валют:', error);
  }
}

/**
 * Получает курсы валют с API open.er-api.com (бесплатный без ключа)
 */
async function fetchExchangeRates(baseCurrency: string): Promise<{ [key: string]: number } | null> {
  try {
    // Сначала проверяем кеш
    const cached = getCachedRates(baseCurrency);
    if (cached) {
      console.log(`Используем кешированные курсы для ${baseCurrency}`);
      return cached.rates;
    }

    console.log(`Загружаем курсы валют для ${baseCurrency} с API`);
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (data.result !== 'success') {
      throw new Error('API вернул ошибку');
    }

    // Сохраняем в кеш
    setCachedRates(baseCurrency, data.rates);

    return data.rates;
  } catch (error) {
    console.error('Ошибка получения курсов валют:', error);
    return null;
  }
}

/**
 * Конвертирует цену из одной валюты в другие
 */
export async function convertPrice(
  price: number,
  fromCurrency: string,
  targetCurrencies: string[]
): Promise<{ [key: string]: number } | null> {
  try {
    const rates = await fetchExchangeRates(fromCurrency);
    if (!rates) return null;

    const result: { [key: string]: number } = {};

    for (const targetCurrency of targetCurrencies) {
      if (fromCurrency === targetCurrency) {
        // Если исходная валюта совпадает с целевой
        result[targetCurrency] = price;
      } else if (rates[targetCurrency]) {
        // Конвертируем через курс
        result[targetCurrency] = price * rates[targetCurrency];
      } else {
        console.warn(`Курс для валюты ${targetCurrency} не найден`);
        result[targetCurrency] = 0;
      }
    }

    return result;
  } catch (error) {
    console.error('Ошибка конвертации валют:', error);
    return null;
  }
}

/**
 * Форматирует цену с символами валют
 */
export function formatPriceWithCurrency(price: number, currency: string): string {
  // Округляем до 2 знаков после запятой
  const roundedPrice = Math.round(price * 100) / 100;

  switch (currency) {
    case 'KZT':
      return `${roundedPrice.toLocaleString()} ₸`;
    case 'RUB':
      return `${roundedPrice.toLocaleString()} ₽`;
    case 'USD':
      return `${roundedPrice.toLocaleString()} $`;
    default:
      return `${roundedPrice.toLocaleString()} ${currency}`;
  }
}

/**
 * Основная функция для форматирования цены в трёх валютах
 */
export async function formatPrice(price: number, currency: string): Promise<string> {
  try {
    // Целевые валюты для конвертации
    const targetCurrencies = ['KZT', 'RUB', 'USD'];

    // Конвертируем цену
    const convertedPrices = await convertPrice(price, currency, targetCurrencies);

    if (!convertedPrices) {
      // Если API недоступен, показываем только исходную цену
      return `Цена: ${formatPriceWithCurrency(price, currency)}`;
    }

    // Форматируем цены для всех валют
    const formattedPrices = targetCurrencies
      .map(curr => formatPriceWithCurrency(convertedPrices[curr], curr))
      .join(' | ');

    return `Цена: ${formattedPrices}`;
  } catch (error) {
    console.error('Ошибка форматирования цены:', error);
    // В случае ошибки возвращаем исходную цену
    return `Цена: ${formatPriceWithCurrency(price, currency)}`;
  }
}