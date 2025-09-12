import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories, fetchCategoryTree } from '../../store/slices/categoriesSlice';
import { fetchCompanies } from '../../store/slices/companiesSlice';
import { fetchTenders } from '../../store/slices/tendersSlice';
import { fetchAds } from '../../store/slices/adsSlice';
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
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  
  const { categoryTree } = useAppSelector(state => state.categories);
  const { companies, isLoading: companiesLoading } = useAppSelector(state => state.companies);
  const { tenders } = useAppSelector(state => state.tenders);
  const { ads } = useAppSelector(state => state.ads);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Fetch data for homepage
    dispatch(fetchCategoryTree());
    dispatch(fetchCompanies({ page: 1, filters: { is_popular: true } }));
    dispatch(fetchTenders({ page: 1, filters: { status: 'APPROVED' } }));
    dispatch(fetchAds({ is_current: true }));
  }, [dispatch]);

  // Автоматическая смена рекламы каждые 4 секунды
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [ads.length]);

  // Perform search if URL contains search query
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);
  
  // Отладка: логируем каждое изменение searchResults
  useEffect(() => {
    console.log('=== SEARCH RESULTS CHANGED ===');
    console.log('New searchResults length:', searchResults.length);
    console.log('New searchResults:', searchResults);
    const productCount = searchResults.filter(r => r.type === 'product').length;
    console.log('Product count in searchResults:', productCount);
  }, [searchResults]);

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
      const companies = companiesResponse.results || companiesResponse;
      const products = productsResponse.results || productsResponse;
      
      // Отладочная информация после извлечения
      console.log('Search query:', query);
      console.log('Extracted companies:', companies.length, companies);
      console.log('Extracted products:', products.length, products);
      
      // Combine results
      const combinedResults: SearchResult[] = [
        ...companies.map((company: Company) => ({
          type: 'company' as const,
          data: company,
        })),
        ...products.map((product: Product) => ({
          type: 'product' as const,
          data: product,
        })),
      ];
      
      console.log('=== COMBINED RESULTS DEBUG ===');
      console.log('Companies count:', companies.length);
      console.log('Products count:', products.length);
      console.log('Combined results count:', combinedResults.length);
      console.log('Product titles:', products.map(p => p.title));
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
    console.log('Search cleared - should be 0 results now');
  };


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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

            {/* Banner Ads Section - Moved after search */}
            {ads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <motion.div
                  key={`carousel-${currentAdIndex}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.6 }}
                  className="relative w-full cursor-pointer group"
                  onClick={() => ads[currentAdIndex] && window.open(ads[currentAdIndex].url, '_blank')}
                >
                  {/* Карусель баннеров */}
                  {ads[currentAdIndex] && (
                    <div className="relative h-[120px] md:h-[150px] bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
                      
                      {/* Left orbiz.asia branding */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="text-primary-400 font-bold text-lg md:text-xl tracking-wider">
                          orbiz.asia
                        </div>
                        <div className="flex items-center gap-2 text-dark-400 text-xs md:text-sm">
                          <span>B2B Platform</span>
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
                          <span>B2B Platform</span>
                        </div>
                      </div>

                      {/* Safe zone for ad content (1546x423 equivalent area) */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-[280px] md:w-[400px] lg:w-[500px] xl:w-[600px] h-[80px] md:h-[100px] lg:h-[120px] relative rounded-xl overflow-hidden bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20">
                          
                          {/* Ad background image */}
                          <img
                            src={ads[currentAdIndex].image}
                            alt={ads[currentAdIndex].title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300"
                          />
                          
                          {/* Ad content overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-dark-900/60 flex items-center justify-center">
                            <div className="text-center px-4">
                              <h3 className="text-white font-bold text-sm md:text-lg lg:text-xl mb-1 drop-shadow-lg">
                                {ads[currentAdIndex].title}
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
                  
                  {/* Индикаторы карусели */}
                  {ads.length > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      {ads.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentAdIndex(index);
                          }}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentAdIndex
                              ? 'bg-primary-500 scale-110'
                              : 'bg-dark-600 hover:bg-dark-500'
                          }`}
                          aria-label={`Показать рекламу ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
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
        <section className="py-16 bg-dark-800/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Товары {(() => {
                    const productResults = searchResults.filter(result => result.type === 'product');
                    return productResults.length > 0 && `(${productResults.length})`;
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

            {isSearching ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : searchResults.filter(result => result.type === 'product').length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(() => {
                  const productResults = searchResults.filter(result => result.type === 'product');
                  console.log('=== RENDERING PRODUCTS DEBUG ===');
                  console.log('Total searchResults:', searchResults.length);
                  console.log('All searchResults:', searchResults);
                  console.log('Product results count:', productResults.length);
                  console.log('Product results:', productResults.map(r => (r.data as any)?.title || (r.data as any)?.name));
                  return productResults.slice(0, 20).map((result, index) => (
                    <motion.div
                    key={(result.data as Product).id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card p-6 hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      const product = result.data as Product;
                      
                      // Попробуем найти поставщика среди результатов поиска сначала
                      let supplier = searchResults.find(r => 
                        r.type === 'company' && 
                        (r.data as Company).name === product.company_name
                      );
                      
                      if (supplier) {
                        // Открываем в новой вкладке
                        window.open(`/company/${(supplier.data as Company).id}`, '_blank');
                      } else {
                        // Если поставщик не найден в результатах поиска, 
                        // попробуем найти его через API по названию компании
                        const searchCompanyByName = async () => {
                          try {
                            const companiesResponse = await apiService.get('/companies/', { 
                              search: product.company_name 
                            });
                            const companies = companiesResponse.results || companiesResponse;
                            const foundCompany = companies.find((c: Company) => c.name === product.company_name);
                            if (foundCompany) {
                              window.open(`/company/${foundCompany.id}`, '_blank');
                            }
                          } catch (error) {
                            console.error('Не удалось найти компанию:', error);
                          }
                        };
                        searchCompanyByName();
                      }
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
                              {product.price} {product.currency}
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
                            Перейти к поставщику →
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                  ));
                })()}
              </div>
            )}
            
            {(() => {
              const productResults = searchResults.filter(result => result.type === 'product');
              return productResults.length > 20 && (
                <div className="text-center mt-8">
                  <p className="text-dark-300">
                    Показано {Math.min(20, productResults.length)} из {productResults.length} товаров
                  </p>
                </div>
              );
            })()}
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {companies.slice(0, 12).map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-4 hover:border-primary-500 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Название компании */}
                    <h3 className="text-sm font-semibold text-white line-clamp-2">
                      {company.name}
                    </h3>
                    
                    {/* Город */}
                    <div className="flex items-center text-dark-400 text-xs">
                      📍 {company.city}
                    </div>
                    
                    {/* Телефон */}
                    <div className="flex items-center text-dark-400 text-xs">
                      📞 {company.contacts?.phones?.[0] || company.contacts?.phone || 'Телефон не указан'}
                    </div>
                    
                    {/* Категории деятельности */}
                    <div className="flex items-center text-dark-400 text-xs">
                      🏷️ {company.categories && company.categories.length > 0 
                        ? company.categories[0].name 
                        : 'Категория не указана'}
                    </div>
                  </div>
                </motion.div>
                ))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenders.slice(0, 6).map((tender, index) => (
                <motion.div
                  key={tender.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-4 hover:border-primary-500 transition-colors cursor-pointer group"
                  onClick={() => tender.company?.id && navigate(`/company/${tender.company.id}?tab=tenders`)}
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
                    
                    {/* Бюджет */}
                    <div className="space-y-1">
                      <div className="text-dark-400 text-xs">Бюджет:</div>
                      <div className="text-primary-400 font-bold text-sm">
                        {tender.budget_min && tender.budget_max 
                          ? `${tender.budget_min.toLocaleString()} - ${tender.budget_max.toLocaleString()} ₽`
                          : tender.budget_min 
                            ? `от ${tender.budget_min.toLocaleString()} ₽`
                            : tender.budget_max
                              ? `до ${tender.budget_max.toLocaleString()} ₽`
                              : 'Бюджет не указан'
                        }
                      </div>
                    </div>
                    
                    {/* Ссылка на компанию */}
                    {tender.company?.id && (
                      <div className="text-primary-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Смотреть компанию →
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
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