import React, { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/currencyService';

interface PriceDisplayProps {
  price: number;
  currency: string;
  className?: string;
}

/**
 * Компонент для отображения цены в трёх валютах (KZT, RUB, USD)
 * Использует API exchangerate.host для получения актуальных курсов
 * Кеширует результаты в localStorage на 4 часа
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  currency,
  className = ''
}) => {
  const [formattedPrice, setFormattedPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFormattedPrice = async () => {
      setIsLoading(true);

      try {
        const result = await formatPrice(price, currency);

        // Проверяем, что компонент ещё примонтирован
        if (isMounted) {
          setFormattedPrice(result);
        }
      } catch (error) {
        console.error('Ошибка загрузки цены:', error);

        if (isMounted) {
          // В случае ошибки показываем исходную цену
          setFormattedPrice(`🏷️ ${price.toLocaleString()} ${currency}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Проверяем, что цена валидная
    if (price > 0 && currency) {
      loadFormattedPrice();
    } else {
      setFormattedPrice('По запросу');
      setIsLoading(false);
    }

    // Cleanup функция для предотвращения memory leaks
    return () => {
      isMounted = false;
    };
  }, [price, currency]);

  if (isLoading) {
    return (
      <div className={`text-primary-400 font-semibold ${className}`}>
        <span className="animate-pulse">Загрузка цены...</span>
      </div>
    );
  }

  return (
    <div className={`text-primary-400 font-semibold ${className}`}>
      {formattedPrice}
    </div>
  );
};

export default PriceDisplay;