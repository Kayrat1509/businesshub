import React, { useState } from 'react';
import { Package } from 'lucide-react';
import PriceDisplay from '../PriceDisplay';

interface Product {
  id: number;
  title: string;
  description: string;
  price?: number;
  currency: string;
  is_service: boolean;
  category?: {
    id: number;
    name: string;
  };
  image?: string;
  rating?: number;
  in_stock: boolean;
  company_name?: string;
  created_at?: string;
}

interface ProductCardProps {
  product: Product;
  showCompany?: boolean;
  onClick?: (product: Product) => void;
  actions?: React.ReactNode;
  variant?: 'default' | 'compact';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showCompany = false,
  onClick,
  actions,
  variant = 'default'
}) => {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  // Ограничиваем описание
  const shortDescription = product.description && product.description.length > 100
    ? product.description.substring(0, 100) + '...'
    : product.description;

  const cardClasses = variant === 'compact'
    ? "card p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
    : "card p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200";

  const imageHeight = variant === 'compact' ? 'h-40' : 'h-48';

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      {/* Изображение товара */}
      <div className={`relative ${imageHeight} bg-dark-700 rounded-lg mb-4 overflow-hidden`}>
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-dark-500" />
          </div>
        )}

        {/* Тип товара */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            product.is_service
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {product.is_service ? 'Услуга' : 'Товар'}
          </span>
        </div>

        {/* Статус наличия */}
        {!product.is_service && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              product.in_stock
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {product.in_stock ? 'В наличии' : 'Нет в наличии'}
            </span>
          </div>
        )}
      </div>

      {/* Контент карточки */}
      <div className="space-y-3">
        {/* Заголовок */}
        <h4 className={`font-semibold text-white line-clamp-2 ${
          variant === 'compact' ? 'text-base' : 'text-lg'
        }`}>
          {product.title}
        </h4>

        {/* Категория */}
        {product.category && (
          <div className="flex items-center">
            <span className="inline-block px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-full">
              {product.category.name}
            </span>
          </div>
        )}

        {/* Описание */}
        <p className={`text-dark-300 line-clamp-3 ${
          variant === 'compact' ? 'text-xs' : 'text-sm'
        }`}>
          {shortDescription}
        </p>

        {/* Компания (если нужно отображать) */}
        {showCompany && product.company_name && (
          <div className="flex items-center text-dark-400 text-xs">
            <Package className="w-3 h-3 mr-1" />
            {product.company_name}
          </div>
        )}

        {/* Цена */}
        <div className="flex flex-col space-y-2">
          {product.price ? (
            <PriceDisplay
              price={product.price}
              currency={product.currency}
              className="text-sm"
            />
          ) : (
            <span className="text-dark-400 text-sm">По запросу</span>
          )}

          {/* Рейтинг */}
          {product.rating && (
            <div className="flex items-center text-yellow-400 text-sm">
              <span>★ {product.rating}</span>
            </div>
          )}
        </div>

        {/* Дополнительные действия */}
        {actions && (
          <div className="pt-2 border-t border-dark-700">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;