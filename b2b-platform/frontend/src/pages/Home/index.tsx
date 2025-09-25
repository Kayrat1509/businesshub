import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories, fetchCategoryTree } from '../../store/slices/categoriesSlice';
import { fetchCompanies } from '../../store/slices/companiesSlice';
import { fetchTenders } from '../../store/slices/tendersSlice';
import { fetchAds } from '../../store/slices/adsSlice';
// добавлен сервис для работы с валютами
import currencyService from '../../services/currencyService';
import CompanyCard from '../../components/CompanyCard';
import CategoryGrid from '../../components/CategoryGrid';
import TenderCard from '../../components/TenderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  title: string;
  description: string;
  company_name: string;
  price?: number;
  currency: string;
  is_service: boolean;
}

interface SearchResult {
  type: 'company' | 'product';
  data: Company | Product;
}

interface Company {
  id: number
  name: string
  description: string
  category: string
  location: string
  website?: string
  rating?: number
}

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'));

  // добавлены состояния для фильтрации и сортировки товаров
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);

  // добавлено состояние для работы с валютами
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KZT'); // по умолчанию тенге
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());
  const [isLoadingCurrency, setIsLoadingCurrency] = useState<boolean>(false);
  const [searchLocationFilter, setSearchLocationFilter] = useState<string>('all'); // 'all', 'title', 'description'
  const [currentPage, setCurrentPage] = useState<number>(1); // состояние для пагинации товаров
  const [itemsPerPage] = useState<number>(50); // 5x10 = 50 товаров на страницу
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [isCompanyCarouselHovered, setIsCompanyCarouselHovered] = useState(false);
  const [currentTenderIndex, setCurrentTenderIndex] = useState(0);
  const [isTenderCarouselHovered, setIsTenderCarouselHovered] = useState(false);

  const { categoryTree } = useAppSelector(state => state.categories);
  const { companies, isLoading: companiesLoading } = useAppSelector(state => state.companies);
  const { tenders } = useAppSelector(state => state.tenders);
  const { ads } = useAppSelector(state => state.ads);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  // removed sidebar ads

  // Отслеживаем изменения состояния компаний для отладки
  useEffect(() => {
    console.log('Companies loaded:', companies.length, 'Loading:', companiesLoading);
  }, [companies, companiesLoading]);


  useEffect(() => {
    // Загружаем данные для главной страницы
    dispatch(fetchCategoryTree());
    dispatch(fetchCompanies({ page: 1, filters: {} }));
    dispatch(fetchTenders({ page: 1, filters: { status: 'APPROVED' } }));

    // ===== ИСПРАВЛЕНО: ЗАГРУЖАЕМ ТОЛЬКО БАННЕРЫ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ =====
    // Вместо загрузки всех баннеров, загружаем только те, что предназначены для виджетов главной страницы
    // С fallback для совместимости с production
    loadHomePageAds();

    // removed sidebar ads
  }, [dispatch]);

  // ===== ФУНКЦИЯ ЗАГРУЗКИ БАННЕРОВ ГЛАВНОЙ СТРАНИЦЫ =====
  const loadHomePageAds = async () => {
    try {
      // Пробуем загрузить HOME_WIDGET баннеры
      let homeResponse = await dispatch(fetchAds({
        position: 'HOME_WIDGET',
        is_current: true
      })).unwrap();

      // Fallback: если нет HOME_WIDGET, пробуем BANNER
      if (!homeResponse || homeResponse.length === 0) {
        console.log('⚠️ Fallback: загружаем BANNER баннеры для главной страницы');
        homeResponse = await dispatch(fetchAds({
          position: 'BANNER',
          is_current: true
        })).unwrap();
      }

      // Последний fallback: загружаем все активные баннеры и фильтруем
      if (!homeResponse || homeResponse.length === 0) {
        console.log('⚠️ Final fallback: загружаем все активные баннеры');
        const allResponse = await dispatch(fetchAds({ is_current: true })).unwrap();
        // Фильтруем только баннеры для главной страницы
        homeResponse = allResponse.filter(ad =>
          ad.position === 'HOME_WIDGET' || ad.position === 'BANNER'
        );
      }

      console.log('✅ Баннеры главной страницы загружены:', homeResponse?.length || 0, 'штук');
    } catch (error) {
      console.error('❌ Ошибка загрузки баннеров главной страницы:', error);
    }
  };

  // removed sidebar ads

  // ===== ИСПРАВЛЕНО: Автоматическая смена рекламы каждые 4 секунды =====
  // Теперь используем только баннеры для главной страницы
  useEffect(() => {
    const homePageAds = ads.filter(ad => ad.position === 'HOME_WIDGET' || ad.position === 'BANNER');
    if (homePageAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % homePageAds.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [ads]);

  // removed sidebar ads

  // removed sidebar ads

  // Автоматическая смена карусели компаний каждые 6 секунд
  const companiesPerPage = 6; // Количество компаний на одной странице карусели
  const totalCompanyPages = Math.ceil(companies.length / companiesPerPage);
  
  useEffect(() => {
    if (totalCompanyPages > 1 && !isCompanyCarouselHovered && !hasSearched) {
      const interval = setInterval(() => {
        setCurrentCompanyIndex((prev) => (prev + 1) % totalCompanyPages);
      }, 6000);
      
      return () => clearInterval(interval);
    }
  }, [totalCompanyPages, isCompanyCarouselHovered, hasSearched]);

  // Автоматическая смена карусели тендеров каждые 6 секунд
  const tendersPerPage = 6; // Количество тендеров на одной странице карусели
  const totalTenderPages = Math.ceil(tenders.length / tendersPerPage);
  
  useEffect(() => {
    if (totalTenderPages > 1 && !isTenderCarouselHovered && !hasSearched) {
      const interval = setInterval(() => {
        setCurrentTenderIndex((prev) => (prev + 1) % totalTenderPages);
      }, 6000);
      
      return () => clearInterval(interval);
    }
  }, [totalTenderPages, isTenderCarouselHovered, hasSearched]);

  // Perform search if URL contains search query
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);
  
  // функция для извлечения уникальных городов из результатов поиска
  const extractCitiesFromResults = (results: SearchResult[]): string[] => {
    const productResults = results.filter(result => result.type === 'product');
    const cities = productResults.map(result => {
      const product = result.data as Product;
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
  const applyFiltersAndSort = (results: SearchResult[]): SearchResult[] => {
    let productResults = results.filter(result => result.type === 'product');

    // фильтрация по городу
    if (selectedCity) {
      productResults = productResults.filter(result => {
        const product = result.data as Product;
        // безопасная проверка наличия поля company_city
        return (product as any).company_city === selectedCity;
      });
    }

    // фильтрация по месту поиска (в названии или описании)
    if (searchLocationFilter !== 'all' && searchQuery.trim()) {
      productResults = productResults.filter(result => {
        const product = result.data as Product;
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
      productResults.sort((a, b) => {
        const productA = a.data as Product;
        const productB = b.data as Product;

        // Получаем конвертированные цены через функцию getDisplayPrice
        const { price: priceA } = getDisplayPrice(productA);
        const { price: priceB } = getDisplayPrice(productB);

        return priceA - priceB;
      });
    } else if (sortOrder === 'price_desc') {
      productResults.sort((a, b) => {
        const productA = a.data as Product;
        const productB = b.data as Product;

        // Получаем конвертированные цены через функцию getDisplayPrice
        const { price: priceA } = getDisplayPrice(productA);
        const { price: priceB } = getDisplayPrice(productB);

        return priceB - priceA;
      });
    }

    return productResults;
  };

  // обновление фильтрованных результатов при изменении состояний
  useEffect(() => {
    if (searchResults.length > 0) {
      // обновляем список доступных городов
      const cities = extractCitiesFromResults(searchResults);
      setAvailableCities(cities);

      // применяем фильтры и сортировку
      const filtered = applyFiltersAndSort(searchResults);
      setFilteredResults(filtered);
    } else {
      setAvailableCities([]);
      setFilteredResults([]);
    }
  }, [searchResults, selectedCity, sortOrder, convertedPrices, searchLocationFilter]); // добавлен searchLocationFilter

  // отладка: логируем каждое изменение searchResults
  useEffect(() => {
    console.log('=== SEARCH RESULTS CHANGED ===');
    console.log('New searchResults length:', searchResults.length);
    console.log('New searchResults:', searchResults);
    const productCount = searchResults.filter(r => r.type === 'product').length;
    console.log('Product count in searchResults:', productCount);
  }, [searchResults]);

  // автоматическая конвертация цен при получении новых результатов поиска или смене валюты
  useEffect(() => {
    if (searchResults.length > 0 && selectedCurrency) {
      // Конвертируем ВСЕ цены в выбранную валюту, включая товары в той же валюте
      const convertPrices = async () => {
        setIsLoadingCurrency(true);

        try {
          const productsInResults = searchResults
            .filter(result => result.type === 'product')
            .map(result => result.data as Product);

          const newConvertedPrices = new Map<string, number>();

          for (const product of productsInResults) {
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
  }, [searchResults, selectedCurrency]);

  const saveSearchToHistory = async (query: string) => {
    if (!isAuthenticated || !query.trim()) {
return;
}
    
    try {
      await apiService.post('/auth/search-history/', {
        query,
        category: '',
        location: '',
      });
    } catch (error) {
      console.error('Failed to save search to history:', error);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    // Очищаем предыдущие результаты поиска
    setSearchResults([]);
    setIsSearching(true);
    setHasSearched(true);
    
    console.log('=== STARTING NEW SEARCH ===');
    console.log('Query:', query);
    console.log('SearchResults cleared');
    
    try {
      // Save to search history if user is authenticated
      if (isAuthenticated) {
        await saveSearchToHistory(query);
      }
      
      // Отладочная информация перед запросом
      console.log('Starting search for query:', query);
      
      // Search companies and products in parallel
      const [companiesResponse, productsResponse] = await Promise.all([
        apiService.get('/companies/', { search: query }),
        apiService.get('/products/', { search: query }),
      ]);
      
      // Отладочная информация после запроса
      console.log('Raw companies response:', companiesResponse);
      console.log('Raw products response:', productsResponse);
      
      // Извлекаем results из пагинированного ответа
      const companies = (companiesResponse as any).results || companiesResponse;
      const products = (productsResponse as any).results || productsResponse;
      
      // Отладочная информация после извлечения
      console.log('Search query:', query);
      console.log('Extracted companies:', companies.length, companies);
      console.log('Extracted products:', products.length, products);
      
      // ===== ИЗМЕНЕННАЯ ЛОГИКА СОРТИРОВКИ ТОВАРОВ =====
      // Теперь сортируем товары по релевантности: сначала совпадения в названии, потом в описании

      // Функция для определения релевантности товара по поисковому запросу
      const getProductRelevance = (product: Product, searchQuery: string): number => {
        const queryLower = searchQuery.toLowerCase();
        const titleLower = product.title.toLowerCase();
        const descriptionLower = product.description.toLowerCase();

        // Приоритет 1: точное совпадение в названии (высший приоритет)
        if (titleLower === queryLower) return 1;

        // Приоритет 2: название начинается с поискового запроса
        if (titleLower.startsWith(queryLower)) return 2;

        // Приоритет 3: поисковый запрос есть в названии (любое вхождение)
        if (titleLower.includes(queryLower)) return 3;

        // Приоритет 4: точное совпадение в описании
        if (descriptionLower === queryLower) return 4;

        // Приоритет 5: описание начинается с поискового запроса
        if (descriptionLower.startsWith(queryLower)) return 5;

        // Приоритет 6: поисковый запрос есть в описании (любое вхождение)
        if (descriptionLower.includes(queryLower)) return 6;

        // Приоритет 7: нет прямых совпадений (для товаров, найденных бэкендом по другим критериям)
        return 7;
      };

      // Сортируем товары по релевантности (меньшее число = выше приоритет)
      const sortedProducts = products.sort((a: Product, b: Product) => {
        const relevanceA = getProductRelevance(a, query);
        const relevanceB = getProductRelevance(b, query);

        // Если релевантность одинаковая, сортируем по названию в алфавитном порядке
        if (relevanceA === relevanceB) {
          return a.title.localeCompare(b.title);
        }

        return relevanceA - relevanceB;
      });

      // Combine results с отсортированными товарами
      const combinedResults: SearchResult[] = [
        ...companies.map((company: Company) => ({
          type: 'company' as const,
          data: company,
        })),
        // Используем отсортированный массив товаров вместо исходного
        ...sortedProducts.map((product: Product) => ({
          type: 'product' as const,
          data: product,
        })),
      ];
      
      console.log('=== COMBINED RESULTS DEBUG ===');
      console.log('Companies count:', companies.length);
      console.log('Products count (original):', products.length);
      console.log('Products count (sorted):', sortedProducts.length);
      console.log('Combined results count:', combinedResults.length);

      // Показываем как изменился порядок товаров после сортировки
      console.log('Original products order:', products.map(p => p.title));
      console.log('Sorted products order:', sortedProducts.map(p => p.title));
      console.log('Combined results:', combinedResults);
      
      setSearchResults(combinedResults);
      
      // Отладка после установки результатов
      console.log('SearchResults SET to:', combinedResults);
      console.log('SearchResults length:', combinedResults.length);
    } catch (error) {
      // Убираем показ ошибки в toast, логируем только в консоль
      console.error('Search error:', error);
      setSearchResults([]); // Устанавливаем пустой результат при ошибке
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL params
      setSearchParams({ q: searchQuery });
      performSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    console.log('=== CLEARING SEARCH ===');
    console.log('Before clear - searchResults length:', searchResults.length);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchParams({});
    // сбрасываем фильтры при очистке поиска
    setSelectedCity('');
    setSortOrder('');
    setAvailableCities([]);
    setFilteredResults([]);
    console.log('Search cleared - should be 0 results now');
  };

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
    const resultsSection = document.querySelector('.products-results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };


  // Функции управления каруселью компаний
  const nextCompanyPage = () => {
    setCurrentCompanyIndex((prev) => (prev + 1) % totalCompanyPages);
  };

  const prevCompanyPage = () => {
    setCurrentCompanyIndex((prev) => (prev - 1 + totalCompanyPages) % totalCompanyPages);
  };

  const handleCompanyClick = (companyId: number) => {
    navigate(`/company/${companyId}`);
  };

  // Функции управления каруселью тендеров
  const nextTenderPage = () => {
    setCurrentTenderIndex((prev) => (prev + 1) % totalTenderPages);
  };

  const prevTenderPage = () => {
    setCurrentTenderIndex((prev) => (prev - 1 + totalTenderPages) % totalTenderPages);
  };

  const handleTenderClick = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
  };

  // Функция для получения товаров текущей страницы
  const getCurrentPageProducts = (): SearchResult[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  };

  // Функция для подсчета общего количества страниц
  const getTotalPages = (): number => {
    return Math.ceil(filteredResults.length / itemsPerPage);
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


  return (
    <div className="min-h-screen" style={{ marginTop: '-50px' }}>
      {/* removed sidebar ads */}

      {/* removed sidebar ads */}

      {/* Hero Section - содержимое сдвинуто на 50px вверх */}
      <section className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 text-gradient leading-tight">
              Поиск товаров от
              <br />
              производителей и дилеров
            </h1>
            <p className="text-xl md:text-2xl text-dark-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Оптовые поставщики и производители
              <br />
              из России, Казахстана, Узбекистана, Кыргызстана.
            </p>


            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex">
                  <input
                    id="search-input"
                    name="search"
                    type="text"
                    placeholder="Поиск товаров от производителей и дилеров..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 input pl-12 pr-4 py-4 text-lg rounded-l-xl border-r-0 focus:border-primary-500 focus:ring-primary-500 bg-dark-700/50 backdrop-blur"
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="btn-primary px-8 py-4 text-lg rounded-r-xl hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-6 h-6" />
                    )}
                  </button>
                </div>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              </form>
            </motion.div>

            {/* ===== ИСПРАВЛЕНО: Banner Ads Section - Показываем только HOME_WIDGET и BANNER баннеры ===== */}
            {/* Фильтруем баннеры, чтобы показывать только те, что предназначены для главной страницы */}
            {ads.length > 0 && ads.filter(ad => ad.position === 'HOME_WIDGET' || ad.position === 'BANNER').length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                {(() => {
                  // Фильтруем только баннеры для главной страницы
                  const homePageAds = ads.filter(ad => ad.position === 'HOME_WIDGET' || ad.position === 'BANNER');
                  const currentHomeAd = homePageAds[currentAdIndex % homePageAds.length];

                  return (
                    <motion.div
                      key={`carousel-${currentAdIndex}`}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.6 }}
                      className="relative w-full cursor-pointer group"
                      onClick={() => currentHomeAd && window.open(currentHomeAd.url, '_blank')}
                    >
                      {/* ===== ИСПРАВЛЕНО: Карусель баннеров - используем отфильтрованный баннер ===== */}
                      {currentHomeAd && (
                        <div className="relative h-[120px] md:h-[150px] bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
                      
                      {/* Left orbiz.asia branding */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="text-primary-400 font-bold text-lg md:text-xl tracking-wider">
                          orbiz.asia
                        </div>
                        <div className="flex items-center gap-2 text-dark-400 text-xs md:text-sm">
                          <span>B2B PLATFORM</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/login');
                            }}
                            className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs hover:bg-primary-500/30 transition-colors"
                          >
                            Кабинет
                          </button>
                        </div>
                      </div>

                      {/* Right orbiz.asia branding */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="text-primary-400 font-bold text-lg md:text-xl tracking-wider text-right">
                          orbiz.asia
                        </div>
                        <div className="flex items-center gap-2 justify-end text-dark-400 text-xs md:text-sm">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/login');
                            }}
                            className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs hover:bg-primary-500/30 transition-colors"
                          >
                            Кабинет
                          </button>
                          <span>B2B PLATFORM</span>
                        </div>
                      </div>

                      {/* Safe zone for ad content (1546x423 equivalent area) */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-[280px] md:w-[400px] lg:w-[500px] xl:w-[600px] h-[80px] md:h-[100px] lg:h-[120px] relative rounded-xl overflow-hidden bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20">
                          
                          {/* ===== ИСПРАВЛЕНО: Ad background image - используем отфильтрованный баннер ===== */}
                          <img
                            src={currentHomeAd.image}
                            alt={currentHomeAd.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300"
                          />

                          {/* ===== ИСПРАВЛЕНО: Ad content overlay - используем отфильтрованный баннер ===== */}
                          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-dark-900/60 flex items-center justify-center">
                            <div className="text-center px-4">
                              <h3 className="text-white font-bold text-sm md:text-lg lg:text-xl mb-1 drop-shadow-lg">
                                {currentHomeAd.title}
                              </h3>
                              <div className="flex items-center justify-center gap-2">
                                <span className="px-2 py-1 bg-primary-600/80 text-white text-xs rounded-full backdrop-blur-sm">
                                  Реклама
                                </span>
                                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-primary-400 group-hover:translate-x-1 transition-transform duration-300" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subtle background pattern */}
                      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                      
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}

                        {/* ===== ИСПРАВЛЕНО: Индикаторы карусели - используем отфильтрованные баннеры ===== */}
                        {/* Показываем индикаторы только если есть несколько баннеров для главной страницы */}
                        {homePageAds.length > 1 && (
                          <div className="flex justify-center mt-4 space-x-2">
                            {homePageAds.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentAdIndex(index);
                                }}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                  index === (currentAdIndex % homePageAds.length)
                                    ? 'bg-primary-500 scale-110'
                                    : 'bg-dark-600 hover:bg-dark-500'
                                }`}
                                aria-label={`Показать рекламу ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <button 
                onClick={() => navigate('/suppliers')}
                className="btn-outline px-6 py-3 hover:shadow-glow"
              >
                Все поставщики
              </button>
              <Link to="/tenders" className="btn-ghost px-6 py-3 hover:bg-dark-700">
                Тендеры
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products Results Section */}
      {hasSearched && (
        <section className="py-16 bg-dark-800/30 products-results-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Товары {(() => {
                    // отображаем количество фильтрованных результатов
                    return filteredResults.length > 0 && `(${filteredResults.length})`;
                  })()}
                </h2>
                <p className="text-dark-300">
                  По категории: <span className="text-primary-400 font-medium">"{searchQuery}"</span>
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="btn-ghost flex items-center space-x-2 hover:bg-dark-700"
              >
                <X className="w-4 h-4" />
                <span>Очистить</span>
              </button>
            </div>

            {/* добавлены фильтры по городам, валютам, месту поиска и сортировка */}
            {searchResults.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-dark-700/50 rounded-lg">
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

                {/* счётчик результатов */}
                <div className="flex items-end">
                  <div className="text-sm text-dark-400">
                    Показано: <span className="text-primary-400 font-semibold">{filteredResults.length}</span> из <span className="text-white">{searchResults.filter(r => r.type === 'product').length}</span> товаров
                  </div>
                </div>
              </div>
            )}

            {isSearching ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-white mb-2">Товары не найдены</h3>
                <p className="text-dark-300 mb-6">
                  По запросу "{searchQuery}" товары не найдены
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={clearSearch}
                    className="btn-outline px-6 py-2"
                  >
                    Очистить поиск
                  </button>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setHasSearched(false);
                      setSearchParams({});
                    }}
                    className="btn-primary px-6 py-2"
                  >
                    На главную
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Сетка товаров 5x10 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" id="products-results-section">
                  {getCurrentPageProducts().map((result, index) => (
                    <motion.div
                    key={(result.data as Product).id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card p-6 hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      const product = result.data as Product;

                      // ===== ИСПРАВЛЕННАЯ ЛОГИКА КЛИКА =====
                      // Теперь при клике на товар открываем страницу товара, а не компании
                      // Используем роут /product/:id для отображения детальной информации о товаре
                      navigate(`/product/${product.id}`);
                    }}
                  >
                    {(() => {
                      const product = result.data as Product;
                      return (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                              {product.is_service ? 'Услуга' : 'Товар'}
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
                        </>
                      );
                    })()}
                  </motion.div>
                  ))}
                </div>

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
                    Показано {Math.min(currentPage * itemsPerPage, filteredResults.length)} из {filteredResults.length} товаров
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      )}





      {/* Popular Companies Section - Hide when showing search results */}
      {!hasSearched && (
        <section className="py-20 px-4 bg-dark-800/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-between items-center mb-12"
            >
              <div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Поставщики
                </h2>
                <p className="text-xl text-dark-300">
                  Проверенные производители, дилеры и торговые представители
                </p>
              </div>
              <Link
                to="/suppliers"
                className="btn-outline flex items-center space-x-2 hover:shadow-glow"
              >
                <span>Смотреть все</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {companiesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-white mb-2">Поставщики не найдены</h3>
                <p className="text-dark-300">В системе пока нет зарегистрированных поставщиков</p>
              </div>
            ) : (
              <div 
                className="relative"
                onMouseEnter={() => setIsCompanyCarouselHovered(true)}
                onMouseLeave={() => setIsCompanyCarouselHovered(false)}
              >
                {/* Карусель */}
                <div className="overflow-hidden">
                  <motion.div
                    key={currentCompanyIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
                  >
                    {companies
                      .slice(
                        currentCompanyIndex * companiesPerPage,
                        (currentCompanyIndex + 1) * companiesPerPage
                      )
                      .map((company, index) => (
                        <motion.div
                          key={company.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className="card p-4 hover:border-primary-500 transition-colors cursor-pointer"
                          onClick={() => handleCompanyClick(company.id)}
                        >
                          <div className="space-y-3">
                            {/* Название компании */}
                            <h3 className="text-sm font-semibold text-white line-clamp-2">
                              {company.name}
                            </h3>
                            
                            {/* Город */}
                            <div className="flex items-center text-dark-400 text-xs">
                              📍 {company.city || 'Город не указан'}
                            </div>

                            {/* Телефон */}
                            <div className="flex items-center text-dark-400 text-xs">
                              📞 {(company.contacts && (
                                company.contacts.phones?.[0] ||
                                company.contacts.phone
                              )) || 'Телефон не указан'}
                            </div>

                            {/* Категории деятельности */}
                            <div className="flex items-center text-dark-400 text-xs">
                              🏷️ {(company.categories && company.categories.length > 0)
                                ? company.categories[0].name
                                : 'Категория не указана'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </motion.div>
                </div>

                {/* Стрелки управления */}
                {totalCompanyPages > 1 && (
                  <>
                    <button
                      onClick={prevCompanyPage}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={nextCompanyPage}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Индикаторы */}
                {totalCompanyPages > 1 && (
                  <div className="flex justify-center mt-8 space-x-2">
                    {Array.from({ length: totalCompanyPages }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentCompanyIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentCompanyIndex
                            ? 'bg-primary-500 scale-110'
                            : 'bg-dark-600 hover:bg-dark-500'
                        }`}
                        aria-label={`Показать группу поставщиков ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tenders Section - Hide when showing search results */}
      {!hasSearched && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-between items-center mb-12"
            >
              <div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Актуальные тендеры
                </h2>
                <p className="text-xl text-dark-300">
                  Новые возможности для вашего бизнеса
                </p>
              </div>
              <Link 
                to="/tenders" 
                className="btn-outline flex items-center space-x-2 hover:shadow-glow"
              >
                <span>Все тендеры</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <div 
              className="relative"
              onMouseEnter={() => setIsTenderCarouselHovered(true)}
              onMouseLeave={() => setIsTenderCarouselHovered(false)}
            >
              {/* Карусель тендеров */}
              <div className="overflow-hidden">
                <motion.div
                  key={currentTenderIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {tenders
                    .slice(
                      currentTenderIndex * tendersPerPage,
                      (currentTenderIndex + 1) * tendersPerPage
                    )
                    .map((tender, index) => (
                      <motion.div
                        key={tender.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="card p-4 hover:border-primary-500 transition-colors cursor-pointer group"
                        onClick={() => handleTenderClick(tender.id)}
                      >
                        <div className="space-y-3">
                          {/* Название тендера */}
                          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                            {tender.title}
                          </h3>
                          
                          {/* Город поставки */}
                          <div className="flex items-center text-dark-400 text-xs">
                            📍 {tender.city}
                          </div>
                          
                          {/* Статус - показываем только если активный */}
                          {tender.status === 'APPROVED' && (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                              активный
                            </span>
                          )}
                          
                          {/* Бюджет с валютой */}
                          <div className="space-y-1">
                            <div className="text-dark-400 text-xs">Бюджет:</div>
                            <div className="text-primary-400 font-bold text-sm">
                              {(() => {
                                const getCurrencySymbol = (currency?: string) => {
                                  switch (currency) {
                                    case 'USD': return '$';
                                    case 'RUB': return '₽';
                                    case 'KZT':
                                    default: return '₸';
                                  }
                                };
                                const symbol = getCurrencySymbol(tender.currency);
                                
                                if (tender.budget_min && tender.budget_max) {
                                  return `${tender.budget_min.toLocaleString()} - ${tender.budget_max.toLocaleString()} ${symbol}`;
                                }
                                if (tender.budget_min) {
                                  return `от ${tender.budget_min.toLocaleString()} ${symbol}`;
                                }
                                if (tender.budget_max) {
                                  return `до ${tender.budget_max.toLocaleString()} ${symbol}`;
                                }
                                return 'Бюджет не указан';
                              })()}
                            </div>
                          </div>
                          
                          {/* Срок поставки */}
                          {tender.deadline_date && (
                            <div className="space-y-1">
                              <div className="text-dark-400 text-xs">Крайний срок:</div>
                              <div className="text-white text-sm">
                                {new Date(tender.deadline_date).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          )}
                          
                          {/* Ссылка на тендер */}
                          <div className="text-primary-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Смотреть тендер →
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              </div>

              {/* Стрелки управления */}
              {totalTenderPages > 1 && (
                <>
                  <button
                    onClick={prevTenderPage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={nextTenderPage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {/* Индикаторы */}
              {totalTenderPages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalTenderPages }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTenderIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTenderIndex
                          ? 'bg-primary-500 scale-110'
                          : 'bg-dark-600 hover:bg-dark-500'
                      }`}
                      aria-label={`Показать группу тендеров ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Готовы развивать свой бизнес?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Присоединяйтесь к тысячам успешных компаний на нашей платформе
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => {
                  (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
                }}
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold"
              >
                Найти товары
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;