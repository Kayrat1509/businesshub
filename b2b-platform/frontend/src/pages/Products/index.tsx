import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api';
import { useNavigate } from 'react-router-dom';
// добавлен сервис для работы с валютами
import currencyService from '../../services/currencyService';

interface Product {
  id: number;
  title: string;
  description: string;
  company_name: string;
  price?: number;
  currency: string;
  is_service: boolean;
}

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // состояния для фильтрации и сортировки товаров
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [searchLocationFilter, setSearchLocationFilter] = useState<string>('all'); // 'all', 'title', 'description'
  const [titleSearchQuery, setTitleSearchQuery] = useState('');
  const [descriptionSearchQuery, setDescriptionSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1); // состояние для пагинации товаров
  const [itemsPerPage] = useState<number>(50); // 5x10 = 50 товаров на страницу

  // добавлено состояние для работы с валютами
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KZT'); // по умолчанию тенге
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());
  const [isLoadingCurrency, setIsLoadingCurrency] = useState<boolean>(false);

  useEffect(() => {
    loadAllProducts();
  }, []);

  // автоматическая конвертация цен при получении новых товаров или смене валюты
  useEffect(() => {
    if (products.length > 0 && selectedCurrency) {
      // Конвертируем ВСЕ цены в выбранную валюту, включая товары в той же валюте
      const convertPrices = async () => {
        setIsLoadingCurrency(true);

        try {
          const newConvertedPrices = new Map<string, number>();

          for (const product of products) {
            if (product.price && product.currency) {
              try {
                // ИЗМЕНЕНО: конвертируем ВСЕ товары, независимо от исходной валюты
                const convertedPrice = await currencyService.convert(
                  product.price,
                  product.currency,
                  selectedCurrency
                );

                const key = `${product.id}_${selectedCurrency}`;
                newConvertedPrices.set(key, convertedPrice);

                console.log(`Converted ${product.title}: ${product.price} ${product.currency} -> ${convertedPrice} ${selectedCurrency}`);
              } catch (error) {
                console.warn(`Failed to convert price for product ${product.id}:`, error);
                // В случае ошибки используем оригинальную цену, но всё равно сохраняем в кеш
                const key = `${product.id}_${selectedCurrency}`;
                newConvertedPrices.set(key, product.price);
              }
            }
          }

          setConvertedPrices(newConvertedPrices);
          console.log(`Converted prices for ${newConvertedPrices.size} products to ${selectedCurrency}`);
        } catch (error) {
          console.error('Error during currency conversion:', error);
        } finally {
          setIsLoadingCurrency(false);
        }
      };

      convertPrices();
    }
  }, [products, selectedCurrency]);

  const loadAllProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/products/');

      // Извлекаем results из пагинированного ответа
      const productsData = (response as any).results || response;
      console.log('Loaded products:', productsData.length, productsData);

      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // функция для извлечения уникальных городов из товаров
  const extractCitiesFromProducts = (products: Product[]): string[] => {
    const cities = products.map(product => {
      // безопасная проверка наличия поля company_city
      return (product as any).company_city;
    }).filter(city => city && city.trim() !== '');

    return Array.from(new Set(cities)).sort();
  };

  // функция для определения места поиска в товаре
  const getSearchLocation = (product: Product, searchQuery: string): 'title' | 'description' | 'both' | 'none' => {
    if (!searchQuery.trim()) return 'none';

    const queryLower = searchQuery.toLowerCase();
    const titleLower = product.title.toLowerCase();
    const descriptionLower = product.description.toLowerCase();

    const foundInTitle = titleLower.includes(queryLower);
    const foundInDescription = descriptionLower.includes(queryLower);

    if (foundInTitle && foundInDescription) return 'both';
    if (foundInTitle) return 'title';
    if (foundInDescription) return 'description';
    return 'none';
  };

  // функция для фильтрации и сортировки результатов
  const applyFiltersAndSort = (products: Product[]): Product[] => {
    let filteredProducts = [...products];

    // основной поиск по названию и описанию
    if (searchQuery.trim()) {
      filteredProducts = filteredProducts.filter(product => {
        const queryLower = searchQuery.toLowerCase();
        const titleLower = product.title.toLowerCase();
        const descriptionLower = product.description.toLowerCase();

        return titleLower.includes(queryLower) || descriptionLower.includes(queryLower);
      });
    }

    // дополнительный поиск только в названиях
    if (titleSearchQuery.trim()) {
      filteredProducts = filteredProducts.filter(product => {
        const queryLower = titleSearchQuery.toLowerCase();
        const titleLower = product.title.toLowerCase();

        return titleLower.includes(queryLower);
      });
    }

    // дополнительный поиск только в описаниях
    if (descriptionSearchQuery.trim()) {
      filteredProducts = filteredProducts.filter(product => {
        const queryLower = descriptionSearchQuery.toLowerCase();
        const descriptionLower = product.description.toLowerCase();

        return descriptionLower.includes(queryLower);
      });
    }

    // фильтрация по городу
    if (selectedCity) {
      filteredProducts = filteredProducts.filter(product => {
        // безопасная проверка наличия поля company_city
        return (product as any).company_city === selectedCity;
      });
    }

    // фильтрация по месту поиска (в названии или описании)
    if (searchLocationFilter !== 'all' && searchQuery.trim()) {
      filteredProducts = filteredProducts.filter(product => {
        const searchLocation = getSearchLocation(product, searchQuery);

        if (searchLocationFilter === 'title') {
          return searchLocation === 'title' || searchLocation === 'both';
        }
        if (searchLocationFilter === 'description') {
          return searchLocation === 'description' || searchLocation === 'both';
        }

        return true; // для 'all' показываем все
      });
    }

    // сортировка по цене с учетом конвертированных валют
    if (sortOrder === 'price_asc') {
      filteredProducts.sort((a, b) => {
        // Получаем конвертированные цены через функцию getDisplayPrice
        const { price: priceA } = getDisplayPrice(a);
        const { price: priceB } = getDisplayPrice(b);

        return priceA - priceB;
      });
    } else if (sortOrder === 'price_desc') {
      filteredProducts.sort((a, b) => {
        // Получаем конвертированные цены через функцию getDisplayPrice
        const { price: priceA } = getDisplayPrice(a);
        const { price: priceB } = getDisplayPrice(b);

        return priceB - priceA;
      });
    }

    return filteredProducts;
  };

  // обновление фильтрованных результатов при изменении состояний
  useEffect(() => {
    if (products.length > 0) {
      // обновляем список доступных городов
      const cities = extractCitiesFromProducts(products);
      setAvailableCities(cities);

      // применяем фильтры и сортировку
      const filtered = applyFiltersAndSort(products);
      setFilteredProducts(filtered);
    } else {
      setAvailableCities([]);
      setFilteredProducts([]);
    }
  }, [products, searchQuery, titleSearchQuery, descriptionSearchQuery, selectedCity, sortOrder, convertedPrices, searchLocationFilter]);

  // функция для обработки изменения фильтра по городу
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setCurrentPage(1); // сбрасываем на первую страницу при смене фильтра
  };

  // функция для обработки изменения сортировки
  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
    setCurrentPage(1); // сбрасываем на первую страницу при смене сортировки
  };

  // функция для обработки изменения валюты
  const handleCurrencyChange = (currency: string) => {
    if (currency === selectedCurrency) return;
    setSelectedCurrency(currency);
    // Конвертация будет выполнена автоматически через useEffect
  };

  // функция для обработки изменения фильтра по месту поиска
  const handleSearchLocationChange = (location: string) => {
    setSearchLocationFilter(location);
    setCurrentPage(1); // сбрасываем на первую страницу при смене фильтра
  };

  // функция для обработки смены страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // прокручиваем к началу списка товаров
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Функция для получения товаров текущей страницы
  const getCurrentPageProducts = (): Product[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Функция для подсчета общего количества страниц
  const getTotalPages = (): number => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  };

  // Функция для получения цены товара с учетом выбранной валюты
  const getDisplayPrice = (product: Product): { price: number; currency: string } => {
    // Если цена не задана, возвращаем 0 в выбранной валюте
    if (!product.price) {
      return { price: 0, currency: selectedCurrency };
    }

    // Всегда ищем конвертированную цену в выбранной валюте
    const key = `${product.id}_${selectedCurrency}`;
    const convertedPrice = convertedPrices.get(key);

    if (convertedPrice !== undefined) {
      return { price: convertedPrice, currency: selectedCurrency };
    }

    // Если конвертированная цена не найдена, но валюта товара совпадает с выбранной
    if (product.currency === selectedCurrency) {
      return { price: product.price, currency: selectedCurrency };
    }

    // Если нет конвертированной цены и валюты не совпадают, возвращаем оригинальную цену
    // (это состояние должно быть редким, так как конвертация должна произойти автоматически)
    return { price: product.price, currency: product.currency };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTitleSearchQuery('');
    setDescriptionSearchQuery('');
    setSelectedCity('');
    setSortOrder('');
    setSearchLocationFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Каталог товаров
          </h1>
          <p className="text-xl text-dark-300">
            Найдите нужные товары от проверенных поставщиков
          </p>
        </motion.div>

        {/* Search Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Основной поиск */}
          <div className="relative">
            <input
              type="text"
              placeholder="Общий поиск товаров (по названию и описанию)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input pl-12 pr-12 py-4 text-lg rounded-xl bg-dark-700/50 backdrop-blur"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Дополнительные поля поиска */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Поиск в названиях */}
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск только в названиях товаров..."
                value={titleSearchQuery}
                onChange={(e) => setTitleSearchQuery(e.target.value)}
                className="w-full input pl-12 pr-12 py-3 rounded-xl bg-dark-700/50 backdrop-blur"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              {titleSearchQuery && (
                <button
                  onClick={() => setTitleSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Поиск в описаниях */}
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск только в описаниях товаров..."
                value={descriptionSearchQuery}
                onChange={(e) => setDescriptionSearchQuery(e.target.value)}
                className="w-full input pl-12 pr-12 py-3 rounded-xl bg-dark-700/50 backdrop-blur"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              {descriptionSearchQuery && (
                <button
                  onClick={() => setDescriptionSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 p-4 bg-dark-700/50 rounded-lg"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* фильтр по городам */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Фильтр по городу:
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Все города</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* выбор валюты */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Валюта отображения:
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={isLoadingCurrency}
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="KZT">Тенге (KZT)</option>
                  <option value="RUB">Рубли (RUB)</option>
                  <option value="USD">Доллары (USD)</option>
                </select>
                {isLoadingCurrency && (
                  <div className="flex items-center justify-center mt-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                    <span className="ml-2 text-xs text-dark-400">Конвертация...</span>
                  </div>
                )}
              </div>

              {/* фильтр по месту поиска */}
              {searchQuery && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Поиск выполнен:
                  </label>
                  <select
                    value={searchLocationFilter}
                    onChange={(e) => handleSearchLocationChange(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Показать все</option>
                    <option value="title">В названии товара</option>
                    <option value="description">В описаниях</option>
                  </select>
                </div>
              )}

              {/* сортировка по цене */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Сортировка по цене:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">По умолчанию</option>
                  <option value="price_asc">От дешёвых к дорогим</option>
                  <option value="price_desc">От дорогих к дешёвым</option>
                </select>
              </div>

              {/* кнопка очистки фильтров */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="btn-ghost flex items-center space-x-2 hover:bg-dark-600 px-4 py-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Очистить</span>
                </button>
              </div>
            </div>

            {/* счётчик результатов */}
            <div className="mt-4 text-sm text-dark-400">
              Показано: <span className="text-primary-400 font-semibold">{filteredProducts.length}</span> из <span className="text-white">{products.length}</span> товаров
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">Продукты не найдены</h3>
            <p className="text-dark-300 mb-6">
              {(searchQuery || titleSearchQuery || descriptionSearchQuery)
                ? `По вашим поисковым запросам товары не найдены`
                : 'В каталоге пока нет товаров'
              }
            </p>
            {(searchQuery || titleSearchQuery || descriptionSearchQuery || selectedCity || sortOrder || searchLocationFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="btn-outline px-6 py-2"
              >
                Очистить фильтры
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Сетка товаров 5x10 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {getCurrentPageProducts().map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      {product.is_service ? 'Услуга' : 'Продукт'}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  {product.price && (
                    <div className="text-primary-400 font-bold text-xl mb-3">
                      {(() => {
                        const { price, currency } = getDisplayPrice(product);
                        // Форматируем цену для отображения
                        const formattedPrice = price.toLocaleString('ru-RU', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        });
                        return `${formattedPrice} ${currency}`;
                      })()}
                    </div>
                  )}

                  <p className="text-dark-300 text-sm mb-4 line-clamp-3">
                    {product.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-dark-400 text-sm">
                      🏢 {product.company_name}
                    </div>
                  </div>

                  <div className="text-center text-primary-400 text-sm hover:text-primary-300 transition-colors">
                    Подробнее о товаре →
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Пагинация */}
            {getTotalPages() > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                {/* Кнопка "Предыдущая" */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-dark-600 text-white rounded-md hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Назад
                </button>

                {/* Номера страниц (показываем максимум 7 страниц) */}
                <div className="flex space-x-1">
                  {(() => {
                    const totalPages = getTotalPages();
                    const maxVisiblePages = 7;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                    // Корректируем начальную страницу если нужно
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    return (
                      <>
                        {startPage > 1 && (
                          <>
                            <button
                              onClick={() => handlePageChange(1)}
                              className="px-3 py-2 rounded-md bg-dark-600 text-dark-300 hover:bg-dark-500"
                            >
                              1
                            </button>
                            {startPage > 2 && (
                              <span className="px-2 py-2 text-dark-400">...</span>
                            )}
                          </>
                        )}

                        {pages.map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-md ${
                              page === currentPage
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-600 text-dark-300 hover:bg-dark-500'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        {endPage < totalPages && (
                          <>
                            {endPage < totalPages - 1 && (
                              <span className="px-2 py-2 text-dark-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="px-3 py-2 rounded-md bg-dark-600 text-dark-300 hover:bg-dark-500"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Кнопка "Следующая" */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                  className="px-4 py-2 bg-dark-600 text-white rounded-md hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед →
                </button>
              </div>
            )}

            {/* Информация о результатах */}
            <div className="text-center mt-4">
              <p className="text-dark-300">
                Показано {Math.min(currentPage * itemsPerPage, filteredProducts.length)} из {filteredProducts.length} товаров
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Products;