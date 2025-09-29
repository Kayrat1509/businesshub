import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Package, Tag, ChevronRight, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiService from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

// Интерфейсы для типизации данных
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  company_name: string;
  company_city: string;
  company_country: string;
  category?: {
    name: string;
  };
  on_sale: boolean;
}

interface ProductsResponse {
  results: Product[];
  count: number;
}

interface FilterOptions {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  cities: string[];
  countries: string[];
}

interface Filters {
  search: string;
  category: string;
  city: string;
  country: string;
  ordering: string;
}

const Actions: React.FC = () => {
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    cities: [],
    countries: []
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    city: '',
    country: '',
    ordering: '-created_at'
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Загрузка опций для фильтров
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await apiService.get<FilterOptions>('/products/filter-options/');
      setFilterOptions(response);
    } catch (error) {
      console.error('Ошибка загрузки опций фильтров:', error);
    }
  }, []);

  // Загрузка товаров со скидкой с учетом фильтров
  const fetchSaleProducts = useCallback(async (currentFilters: Filters) => {
    try {
      const params: any = {
        on_sale: true,
        page_size: 50
      };

      // Добавляем фильтры, если они заданы
      if (currentFilters.search.trim()) params.search = currentFilters.search.trim();
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.city) params.city = currentFilters.city;
      if (currentFilters.country) params.country = currentFilters.country;
      if (currentFilters.ordering) params.ordering = currentFilters.ordering;

      console.log('API call with params:', params); // Для отладки
      console.log('Full API URL would be:', '/products/', params); // Для отладки

      const response = await apiService.get<ProductsResponse>('/products/', { params });
      console.log('API response:', response); // Для отладки
      setSaleProducts(response.results);
    } catch (error) {
      console.error('Ошибка загрузки товаров со скидкой:', error);
      toast.error('Ошибка при загрузке товаров со скидкой');
    }
  }, []);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await fetchFilterOptions();
        // Используем начальные значения фильтров напрямую
        await fetchSaleProducts({
          search: '',
          category: '',
          city: '',
          country: '',
          ordering: '-created_at'
        });
        setIsInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Только при монтировании

  // Перезагрузка товаров при изменении фильтров (с дебаунсом для поиска)
  useEffect(() => {
    if (!isInitialized) return; // Не выполнять до первой загрузки

    const timeoutId = setTimeout(() => {
      console.log('Filter changed, fetching products...', filters); // Для отладки
      fetchSaleProducts(filters);
    }, filters.search.trim() ? 300 : 0); // 300мс дебаунс только если есть текст поиска

    return () => clearTimeout(timeoutId);
  }, [filters, fetchSaleProducts, isInitialized]);

  // Обработчик клика по товару
  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  // Обработчики изменения фильтров
  const handleFilterChange = (key: keyof Filters, value: string) => {
    console.log('Filter change:', key, '=', value); // Для отладки
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value
      };
      console.log('New filters state:', newFilters); // Для отладки
      return newFilters;
    });
  };

  // Сброс всех фильтров
  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      country: '',
      ordering: '-created_at'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🔥 Акции и скидки
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Выгодные предложения от наших поставщиков и специальные акции
          </p>
        </motion.div>

        {/* Фильтры и поиск */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 rounded-2xl p-6 mb-8"
        >
          {/* Строка поиска */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Поиск по названию или описанию..."
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Категория
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Все категории</option>
                {filterOptions.categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Город */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Город
              </label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Все города</option>
                {filterOptions.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Страна */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Страна
              </label>
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Все страны</option>
                {filterOptions.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Сортировка */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Сортировка
              </label>
              <select
                value={filters.ordering}
                onChange={(e) => handleFilterChange('ordering', e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="-created_at">Новые первые</option>
                <option value="created_at">Старые первые</option>
                <option value="title">По названию (А-Я)</option>
                <option value="-title">По названию (Я-А)</option>
                <option value="price">Цена (по возрастанию)</option>
                <option value="-price">Цена (по убыванию)</option>
                <option value="-rating">По рейтингу</option>
              </select>
            </div>
          </div>

          {/* Активные фильтры и кнопка сброса */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-dark-400">
                Найдено: {saleProducts.length} товаров
              </span>
            </div>

            {(filters.search || filters.category || filters.city || filters.country || filters.ordering !== '-created_at') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Сбросить фильтры</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Товары со скидкой */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
            {saleProducts.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Пока нет товаров со скидкой
                </h3>
                <p className="text-dark-300">
                  Следите за обновлениями - скоро появятся выгодные предложения!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {saleProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -5 }}
                    className="card group cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Изображение товара */}
                    <div className="relative mb-4 rounded-lg overflow-hidden">
                      <img
                        src={product.image || '/api/placeholder/300/200'}
                        alt={product.title}
                        className="w-full h-32 sm:h-40 lg:h-32 xl:h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                          🔥 Скидка
                        </span>
                      </div>
                    </div>

                    {/* Информация о товаре */}
                    <div className="flex-1">
                      <h3 className="text-sm lg:text-base font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
                        {product.title}
                      </h3>

                      <p className="text-dark-300 text-xs lg:text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Категория */}
                      {product.category && (
                        <div className="flex items-center text-dark-400 text-xs mb-2">
                          <Tag className="w-3 h-3 mr-1" />
                          <span className="truncate">{product.category.name}</span>
                        </div>
                      )}

                      {/* Цена */}
                      <div className="mb-2">
                        <span className="text-lg lg:text-xl font-bold text-primary-400">
                          {product.price ? `${product.price} ${product.currency}` : 'Договорная'}
                        </span>
                      </div>

                      {/* Компания */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-dark-300 min-w-0 flex-1">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="text-xs truncate">{product.company_name}</span>
                          {product.company_city && (
                            <span className="text-xs ml-1 flex-shrink-0">• {product.company_city}</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </motion.div>
      </div>
    </div>
  );
};

export default Actions;