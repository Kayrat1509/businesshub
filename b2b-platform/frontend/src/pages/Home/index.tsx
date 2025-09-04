import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Award, ArrowRight, Building2, X } from 'lucide-react';
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
  
  const { categoryTree } = useAppSelector(state => state.categories);
  const { companies, isLoading: companiesLoading } = useAppSelector(state => state.companies);
  const { tenders } = useAppSelector(state => state.tenders);
  const { ads } = useAppSelector(state => state.ads);
  const { products } = useAppSelector(state => state.products);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Fetch data for homepage
    dispatch(fetchCategoryTree());
    dispatch(fetchCompanies({ page: 1, filters: { is_popular: true } }));
    dispatch(fetchTenders({ page: 1, filters: { status: 'APPROVED' } }));
    dispatch(fetchAds({ is_current: true }));
  }, [dispatch]);

  // Perform search if URL contains search query
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

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

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Save to search history if user is authenticated
      if (isAuthenticated) {
        await saveSearchToHistory(query);
      }
      
      // Search companies and products in parallel
      const [companiesResponse, productsResponse] = await Promise.all([
        apiService.get<Company[]>('/companies/', {
          params: { search: query },
        }),
        apiService.get<Product[]>('/products/', {
          params: { search: query },
        }),
      ]);
      
      // Combine results
      const combinedResults: SearchResult[] = [
        ...companiesResponse.map((company: Company) => ({
          type: 'company' as const,
          data: company,
        })),
        ...productsResponse.map((product: Product) => ({
          type: 'product' as const,
          data: product,
        })),
      ];
      
      setSearchResults(combinedResults);
    } catch (error) {
      toast.error('Ошибка поиска');
      console.error('Search error:', error);
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
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchParams({});
  };

  const stats = [
    { icon: Building2, label: 'Компаний', value: '800+', color: 'text-primary-400' },
    { icon: Users, label: 'Пользователей', value: '20,000+', color: 'text-secondary-400' },
    { icon: TrendingUp, label: 'Сделок', value: '100,000+', color: 'text-green-400' },
    { icon: Award, label: 'Категорий', value: '100+', color: 'text-purple-400' },
  ];

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
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gradient leading-tight">
              Поиск товаров от
              <br />
              производителей и дилеров
            </h1>
            <p className="text-xl md:text-2xl text-dark-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Более 10,000 поставщиков с широким ассортиментом товаров
              <br />
              из России, Казахстана, Узбекистана, Кыргызстана.
            </p>

            {/* Banner Ads Section */}
            {ads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-12"
              >
                {ads.map((ad, index) => (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="relative w-full mb-4 last:mb-0 cursor-pointer group"
                    onClick={() => window.open(ad.url, '_blank')}
                  >
                    {/* Full-width banner container */}
                    <div className="relative h-[120px] md:h-[150px] bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
                      
                      {/* Left orbiz.asia branding */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="text-primary-400 font-bold text-lg md:text-xl tracking-wider">
                          orbiz.asia
                        </div>
                        <div className="text-dark-400 text-xs md:text-sm">
                          B2B Platform
                        </div>
                      </div>

                      {/* Right orbiz.asia branding */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="text-primary-400 font-bold text-lg md:text-xl tracking-wider text-right">
                          orbiz.asia
                        </div>
                        <div className="text-dark-400 text-xs md:text-sm text-right">
                          B2B Platform
                        </div>
                      </div>

                      {/* Safe zone for ad content (1546x423 equivalent area) */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-[280px] md:w-[400px] lg:w-[500px] xl:w-[600px] h-[80px] md:h-[100px] lg:h-[120px] relative rounded-xl overflow-hidden bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20">
                          
                          {/* Ad background image */}
                          <img
                            src={ad.image}
                            alt={ad.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300"
                          />
                          
                          {/* Ad content overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-dark-900/60 flex items-center justify-center">
                            <div className="text-center px-4">
                              <h3 className="text-white font-bold text-sm md:text-lg lg:text-xl mb-1 drop-shadow-lg">
                                {ad.title}
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
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex">
                  <input
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

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
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
                  Товары {products.length > 0 && `(${products.length})`}
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
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-white mb-2">Товары не найдены</h3>
                <p className="text-dark-300 mb-6">
                  В этой категории пока нет товаров от поставщиков
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={clearSearch}
                    className="btn-outline px-6 py-2"
                  >
                    Выбрать другую категорию
                  </button>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setHasSearched(false);
                    }}
                    className="btn-primary px-6 py-2"
                  >
                    На главную
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 20).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card p-6 hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        {product.is_service ? 'Услуга' : 'Товар'}
                      </span>
                      <div className="flex items-center text-yellow-400 text-sm">
                        ⭐ {product.rating}
                      </div>
                    </div>
                    
                    {product.primary_image && (
                      <img
                        src={product.primary_image}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    
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
                      {product.category && (
                        <div className="flex items-center text-dark-400 text-sm">
                          🏷️ {product.category.name}
                        </div>
                      )}
                    </div>
                    
                    <button
                      className="w-full btn-primary py-2 text-center block"
                    >
                      Связаться с поставщиком
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            
            {products.length > 20 && (
              <div className="text-center mt-8">
                <p className="text-dark-300">
                  Показано {Math.min(20, products.length)} из {products.length} товаров
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className={`py-8 bg-dark-800/50 ${hasSearched ? 'border-t border-dark-700' : ''}`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-dark-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'ТОО АДАЛ САУДА', description: 'Производитель сантехнического оборудования', location: 'Алматы', category: 'Сантехника' },
                { name: 'ТОО ЭЛЕКТРОКОМПЛЕКТ', description: 'Электротехническое оборудование и материалы', location: 'Нур-Султан', category: 'Электрика' },
                { name: 'ТОО МАСТЕР ДОМ', description: 'Строительные и отделочные материалы', location: 'Шымкент', category: 'Строительные материалы' },
                { name: 'ИП 220 ВОЛЬТ', description: 'Электрооборудование и инструменты', location: 'Караганда', category: 'Электрика' },
              ].map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 hover:border-primary-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                  </div>
                  
                  <p className="text-dark-300 text-sm mb-4 line-clamp-2">
                    {company.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-dark-400 text-sm">
                      🏷️ {company.category}
                    </div>
                    <div className="flex items-center text-dark-400 text-sm">
                      📍 {company.location}
                    </div>
                  </div>
                  
                  <Link
                    to={`/company/${index + 1}`}
                    className="w-full btn-primary py-2 text-center block"
                  >
                    Подробнее
                  </Link>
                </motion.div>
              ))}
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenders.slice(0, 4).map((tender, index) => (
                <motion.div
                  key={tender.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <TenderCard tender={tender} />
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