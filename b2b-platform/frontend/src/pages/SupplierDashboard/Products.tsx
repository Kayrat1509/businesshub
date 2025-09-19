import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setTestUser } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  Package, Plus, Search, Loader, AlertCircle,
  LogIn
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
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
  image?: string  // URL изображения
  in_stock: boolean
  is_active: boolean
  company_name?: string
  created_at?: string
  updated_at?: string
  rating?: number
}


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
            <ProductCard
              key={product.id}
              product={product}
              showCompany={false}
              variant="default"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardProducts;