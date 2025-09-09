import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setTestUser } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  Package, Plus, Search, Loader, AlertCircle, 
  DollarSign, Tag, CheckCircle, XCircle, 
  Image as ImageIcon, ExternalLink, LogIn
} from 'lucide-react';
import apiService from '../../api';

interface Product {
  id: number
  title: string
  sku?: string
  description: string
  price?: number
  currency: string
  is_service: boolean
  category?: Category
  images: string[]
  in_stock: boolean
  is_active: boolean
  company_name?: string
  primary_image?: string
  created_at?: string
  updated_at?: string
  rating?: number
}

interface Category {
  id: number
  name: string
  slug?: string
}

// Курсы валют для конвертации
const EXCHANGE_RATES = {
  KZT: 450.0, // 1 USD = 450 KZT
  RUB: 90.0,  // 1 USD = 90 RUB  
  USD: 1.0    // базовая валюта
};

// Функция конвертации валют
const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return price;
  
  // Конвертируем в USD сначала
  const priceInUSD = price / EXCHANGE_RATES[fromCurrency as keyof typeof EXCHANGE_RATES];
  // Затем в целевую валюту
  const convertedPrice = priceInUSD * EXCHANGE_RATES[toCurrency as keyof typeof EXCHANGE_RATES];
  
  return Math.round(convertedPrice * 100) / 100; // округляем до 2 знаков
};

const DashboardProducts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleQuickLogin = () => {
    dispatch(setTestUser());
    toast.success('Выполнен быстрый вход в систему');
    // Перезагружаем товары после входа
    setTimeout(() => loadProducts(), 500);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('Current user:', user);
    console.log('Auth state:', { isAuthenticated: !!user, hasToken: !!localStorage.getItem('access_token') });
    
    try {
      const data = await apiService.get('/products/my/');
      console.log('Products data:', data);
      // apiService.get уже возвращает response.data
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.error || 
                          'Ошибка загрузки товаров';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Компонент карточки товара
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const [imageError, setImageError] = useState(false);
    
    // Получаем первые 3 изображения
    const displayImages = product.images?.slice(0, 3) || [];
    const primaryImage = product.primary_image || displayImages[0];
    
    // Ограничиваем описание до 2 строк
    const shortDescription = product.description.length > 100 
      ? product.description.substring(0, 100) + '...'
      : product.description;
    
    // Конвертация цены в разные валюты
    const priceConversions = product.price ? {
      kzt: convertPrice(product.price, product.currency, 'KZT'),
      rub: convertPrice(product.price, product.currency, 'RUB'),
      usd: convertPrice(product.price, product.currency, 'USD')
    } : null;

    return (
      <div className="group bg-dark-800 rounded-xl border border-dark-700 overflow-hidden hover:border-primary-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
        {/* Изображения */}
        <div className="relative h-48 bg-dark-700">
          {primaryImage && !imageError ? (
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-dark-500" />
            </div>
          )}
          
          {/* Статус товара */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              product.in_stock 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {product.in_stock ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              <span>{product.in_stock ? 'В наличии' : 'Нет в наличии'}</span>
            </div>
          </div>

          {/* Тип товара */}
          <div className="absolute top-3 right-3">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              product.is_service 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {product.is_service ? (
                <Tag className="w-3 h-3" />
              ) : (
                <Package className="w-3 h-3" />
              )}
              <span>{product.is_service ? 'Услуга' : 'Товар'}</span>
            </div>
          </div>

          {/* Количество изображений */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-dark-900/80 text-white px-2 py-1 rounded text-xs">
              <ImageIcon className="w-3 h-3 inline mr-1" />
              {displayImages.length}
            </div>
          )}
        </div>

        {/* Контент карточки */}
        <div className="p-4">
          {/* Заголовок */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
            {product.title}
          </h3>
          
          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-dark-400 mb-2">
              Артикул: {product.sku}
            </p>
          )}

          {/* Категория */}
          {product.category && (
            <div className="mb-3">
              <span className="inline-block px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-full">
                {product.category.name}
              </span>
            </div>
          )}

          {/* Описание */}
          <p className="text-dark-300 text-sm mb-4 line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>

          {/* Цена и конвертация */}
          {priceConversions && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold">
                  {product.price?.toLocaleString()} {product.currency}
                </span>
              </div>
              <div className="text-xs text-dark-400 space-y-1">
                <div>≈ {priceConversions.kzt.toLocaleString()} KZT</div>
                <div>≈ {priceConversions.rub.toLocaleString()} RUB</div>
                <div>≈ {priceConversions.usd.toLocaleString()} USD</div>
              </div>
            </div>
          )}

          {/* Дата создания */}
          {product.created_at && (
            <div className="text-xs text-dark-500">
              Создано: {new Date(product.created_at).toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Фильтрация товаров по поиску
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.name.toLowerCase().includes(searchLower))
    );
  });

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-dark-300">Загружаем ваши товары...</p>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    const isAuthError = error.includes('не были предоставлены') || error.includes('credential');
    
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {isAuthError ? 'Требуется авторизация' : 'Ошибка загрузки'}
          </h2>
          <p className="text-dark-300 mb-6">
            {isAuthError 
              ? 'Для просмотра товаров необходимо войти в систему'
              : error
            }
          </p>
          <div className="space-x-4">
            {isAuthError && (
              <button
                onClick={handleQuickLogin}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Быстрый вход</span>
              </button>
            )}
            <button
              onClick={loadProducts}
              className="btn-outline"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Мои товары</h1>
          <p className="text-dark-300">
            Товары и услуги вашей компании
          </p>
        </div>
        
        <Link
          to="/dashboard/products/create"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить товар</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            id="product-search"
            name="productSearch"
            placeholder="Поиск по названию, описанию, артикулу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2 text-sm text-dark-300">
            <Package className="w-4 h-4" />
            <span>
              {filteredProducts.length} 
              {filteredProducts.length !== products.length && ` из ${products.length}`} 
              товаров
            </span>
          </div>
          
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-dark-400 hover:text-white text-sm"
            >
              Очистить поиск
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-20 h-20 mx-auto text-dark-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            {products.length === 0 ? 'У вас пока нет товаров' : 'Товары не найдены'}
          </h2>
          <p className="text-dark-300 mb-8 max-w-md mx-auto">
            {products.length === 0 
              ? 'Добавьте свой первый товар или услугу, чтобы начать продавать'
              : searchTerm 
                ? `По запросу "${searchTerm}" ничего не найдено. Попробуйте изменить поисковый запрос.`
                : 'Попробуйте изменить параметры поиска'
            }
          </p>
          {products.length === 0 && (
            <Link
              to="/dashboard/products/create"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить товар</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardProducts;