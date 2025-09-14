import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import CompanyCard from '../../components/CompanyCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api';
import { Company, SupplierType } from '../../types';


const Suppliers = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplierType, setSelectedSupplierType] = useState<string>('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const selectedCitiesRef = useRef<string[]>([]); // Ref для актуального состояния
  const [isSupplierTypeDropdownOpen, setIsSupplierTypeDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Логирование состояния фильтров для отладки
  console.log('Фильтры:', { selectedCities, selectedSupplierType, companiesCount: companies.length });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Load companies
        await loadCompanies();
        
        // Load supplier types
        const supplierTypesResponse = await apiService.get('/companies/supplier-types/');
        setSupplierTypes(supplierTypesResponse?.supplier_types || []);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        setCompanies([]);
        setSupplierTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Extract cities from companies whenever companies change
  useEffect(() => {
    if (companies.length > 0) {
      const uniqueCities = [...new Set(companies.map(company => company.city).filter(Boolean))];
      setCities(uniqueCities.sort());
    } else {
      setCities([]);
    }
  }, [companies]);

  const loadCompanies = useCallback(async (supplierTypeFilter = '', citiesFilter: string[] = []) => {
    try {
      const params = new URLSearchParams();
      if (supplierTypeFilter) params.append('supplier_type', supplierTypeFilter);

      // Добавляем фильтр по городам в CSV формате: cities=Алматы,Астана
      if (citiesFilter.length > 0) {
        params.append('cities', citiesFilter.join(','));
      }

      const queryString = params.toString();
      console.log('API запрос с фильтрами:', {
        supplierType: supplierTypeFilter || 'Все',
        cities: citiesFilter.length > 0 ? citiesFilter.join(', ') : 'Все',
        queryString
      });
      
      let allCompanies: Company[] = [];
      let nextUrl: string | null = `/companies/${queryString ? `?${queryString}` : ''}`;
      console.log('🔗 First request URL:', nextUrl);
      
      // Загружаем все страницы пагинации
      while (nextUrl) {
        const response = await apiService.get(nextUrl);
        
        // Обрабатываем ответ API
        const data = response?.results || response?.data || response || [];
        const companiesData = Array.isArray(data) ? data : [];
        
        allCompanies = [...allCompanies, ...companiesData];
        
        // Проверяем есть ли следующая страница
        const nextPageUrl = response?.next;
        if (nextPageUrl) {
          // Извлекаем только query параметры из URL следующей страницы
          if (nextPageUrl.includes('http')) {
            const url = new URL(nextPageUrl);
            // Используем только search часть (query параметры) с базовым путем /companies/
            nextUrl = `/companies/${url.search}`;
          } else {
            nextUrl = nextPageUrl;
          }
        } else {
          nextUrl = null;
        }
      }
      
      console.log(`📈 Total companies loaded: ${allCompanies.length}`);
      if (citiesFilter.length > 0) {
        console.log(`🏙️  Filtered by cities: ${citiesFilter.join(', ')}`);
        // Показываем по одной компании из каждого города для проверки
        const citiesSample = [...new Set(allCompanies.map(c => c.city))];
        console.log(`🗺️  Cities in results: ${citiesSample.join(', ')}`);
      }
      setCompanies(allCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  }, []); // Пустой массив зависимостей, так как функция не зависит от состояния

  const handleSupplierTypeChange = async (supplierType: string) => {
    setSelectedSupplierType(supplierType);
    setIsSupplierTypeDropdownOpen(false);
    setIsLoading(true);
    
    try {
      await loadCompanies(supplierType, selectedCities);
    } finally {
      setIsLoading(false);
    }
  };

  // Ref для отслеживания активных таймеров загрузки
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Синхронизация ref с state для корректного обновления фильтра
  useEffect(() => {
    selectedCitiesRef.current = selectedCities;
  }, [selectedCities]);

  // Обработка выбора города с автоматической фильтрацией
  const handleCityToggle = useCallback((city: string) => {
    const currentCities = selectedCitiesRef.current;
    const isCurrentlySelected = currentCities.includes(city);
    let newSelectedCities;

    if (isCurrentlySelected) {
      // Убираем город из списка
      newSelectedCities = currentCities.filter(c => c !== city);
      console.log(`Удален город "${city}". Выбранные города:`, newSelectedCities);
    } else {
      // Добавляем город в список
      newSelectedCities = [...currentCities, city];
      console.log(`Добавлен город "${city}". Выбранные города:`, newSelectedCities);
    }

    // Обновляем состояние
    selectedCitiesRef.current = newSelectedCities;
    setSelectedCities(newSelectedCities);

    // Отменяем предыдущий таймер загрузки если есть
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Запускаем отложенную загрузку с debounce для плавности UI
    loadingTimeoutRef.current = setTimeout(async () => {
      console.log('Загрузка компаний с фильтром по городам:', newSelectedCities);
      setIsLoading(true);
      try {
        await loadCompanies(selectedSupplierType, newSelectedCities);
        console.log('Фильтрация выполнена успешно');
      } catch (error) {
        console.error('Ошибка фильтрации:', error);
      } finally {
        setIsLoading(false);
        loadingTimeoutRef.current = null;
      }
    }, 300); // 300ms задержка для завершения выбора нескольких городов

  }, [selectedSupplierType, loadCompanies]);
  
  // ОТКЛЮЧЕНО: Автоматическая фильтрация - мешает множественному выбору
  // Вместо этого используем ручное управление через кнопки "Применить фильтры"
  // useEffect(() => {
  //   const timeoutId = setTimeout(async () => {
  //     console.log('🔄 Loading companies with filters (debounced):');
  //     console.log('  - Supplier type:', selectedSupplierType || 'All');
  //     console.log('  - Cities:', selectedCities.length > 0 ? selectedCities.join(', ') : 'All');
      
  //     setIsLoading(true);
  //     try {
  //       await loadCompanies(selectedSupplierType, selectedCities);
  //       console.log('✅ Companies loaded successfully');
  //     } catch (error) {
  //       console.error('❌ Error loading companies:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }, 300);
    
  //   return () => clearTimeout(timeoutId);
  // }, [selectedCities, selectedSupplierType, loadCompanies]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const supplierTypeDropdown = document.getElementById('supplier-type-dropdown');
      const cityDropdown = document.getElementById('city-dropdown');
      
      // Обычная логика только для supplier type dropdown
      if (supplierTypeDropdown && !supplierTypeDropdown.contains(event.target as Node)) {
        setIsSupplierTypeDropdownOpen(false);
      }
      
      // Закрываем dropdown городов при клике вне его области
      if (isCityDropdownOpen && cityDropdown && !cityDropdown.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };

    // Слушаем клики если открыт любой из dropdown'ов
    if (isSupplierTypeDropdownOpen || isCityDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isSupplierTypeDropdownOpen, isCityDropdownOpen]);

  // Close city dropdown with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCityDropdownOpen) {
          setIsCityDropdownOpen(false);
        }
        if (isSupplierTypeDropdownOpen) {
          setIsSupplierTypeDropdownOpen(false);
        }
      }
    };

    if (isCityDropdownOpen || isSupplierTypeDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCityDropdownOpen, isSupplierTypeDropdownOpen]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Поставщики
        </h1>
        <p className="text-xl text-dark-300 max-w-2xl mx-auto">
          Найдите надежных поставщиков товаров от производителей и дилеров
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex justify-center mb-6 space-x-4 flex-wrap gap-4">

          {/* Supplier Type Filter */}
          <div className="relative" id="supplier-type-dropdown">
            <button
              onClick={() => setIsSupplierTypeDropdownOpen(!isSupplierTypeDropdownOpen)}
              className="flex items-center space-x-2 px-6 py-3 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors min-w-[200px] justify-between"
            >
              <span>{supplierTypes.find(st => st.code === selectedSupplierType)?.name || 'Все типы'}</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${
                  isSupplierTypeDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isSupplierTypeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-dark-800 rounded-lg border border-dark-700 shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="py-2">
                  <button
                    onClick={() => handleSupplierTypeChange('')}
                    className={`w-full text-left px-4 py-2 hover:bg-dark-700 transition-colors ${
                      selectedSupplierType === '' 
                        ? 'bg-primary-600 text-white' 
                        : 'text-dark-300'
                    }`}
                  >
                    Все типы
                  </button>
                  
                  {supplierTypes.map((supplierType) => (
                    <button
                      key={supplierType.code}
                      onClick={() => handleSupplierTypeChange(supplierType.code)}
                      className={`w-full text-left px-4 py-2 hover:bg-dark-700 transition-colors ${
                        selectedSupplierType === supplierType.code 
                          ? 'bg-primary-600 text-white' 
                          : 'text-dark-300'
                      }`}
                    >
                      {supplierType.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* City Filter - Multi-select */}
          <div className="relative" id="city-dropdown">
            <button
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center space-x-2 px-6 py-3 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors min-w-[200px] justify-between"
            >
              <span>
                {selectedCities.length === 0 
                  ? 'Все города' 
                  : selectedCities.length === 1 
                    ? selectedCities[0]
                    : `${selectedCities[0]} (+${selectedCities.length - 1})`
                }
              </span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${
                  isCityDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isCityDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-full bg-dark-800 rounded-lg border border-dark-700 shadow-xl z-50 max-h-80 overflow-y-auto"
                onClick={(e) => {
                  // Предотвращаем закрытие dropdown при клике внутри
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  // Предотвращаем закрытие dropdown при нажатии мыши внутри
                  e.stopPropagation();
                }}
              >
                <div className="py-2">
                  {/* Заголовок с кнопкой закрыть */}
                  <div className="flex justify-between items-center px-4 py-2 border-b border-dark-700 bg-dark-750">
                    <span className="text-sm font-medium text-dark-200">
                      Выберите города {selectedCities.length > 0 && `(${selectedCities.length})`}
                      {selectedCities.length > 0 && (
                        <div className="text-xs text-primary-400 mt-1">
                          {selectedCities.join(', ')}
                        </div>
                      )}
                    </span>
                    <button
                      onClick={() => setIsCityDropdownOpen(false)}
                      className="text-dark-400 hover:text-white transition-colors text-lg font-bold"
                      title="Закрыть (Escape)"
                    >
                      ✕
                    </button>
                  </div>
                  
                  
                  {/* Опция "Сбросить все города" */}
                  {selectedCities.length > 0 && (
                    <button
                      onClick={async () => {
                        console.log('Сброс всех городов');
                        // Отменяем активные таймеры загрузки
                        if (loadingTimeoutRef.current) {
                          clearTimeout(loadingTimeoutRef.current);
                          loadingTimeoutRef.current = null;
                        }

                        selectedCitiesRef.current = [];
                        setSelectedCities([]);
                        setIsLoading(true);
                        try {
                          await loadCompanies(selectedSupplierType, []);
                          console.log('Все города сброшены');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-700 transition-colors text-red-400 text-sm font-medium border-b border-dark-700"
                    >
                      ✕ Сбросить все ({selectedCities.length})
                    </button>
                  )}
                  
                  {cities.map((city) => {
                    const isSelected = selectedCities.includes(city);

                    return (
                      <div
                        key={city}
                        className={`flex items-center px-4 py-2 hover:bg-dark-700 transition-colors cursor-pointer ${
                          isSelected ? 'bg-dark-700 bg-opacity-50' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCityToggle(city);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center w-full pointer-events-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mr-3 w-4 h-4 text-primary-600 bg-dark-700 border-dark-500 rounded"
                          />
                          <span className={`${
                            isSelected ? 'text-primary-400 font-medium' : 'text-dark-300'
                          }`}>
                            {city} {isSelected && '✓'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : companies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {selectedSupplierType || selectedCities.length > 0 ? 'Нет поставщиков по выбранным фильтрам' : 'Нет компаний'}
          </h3>
          <p className="text-dark-300">
            {selectedSupplierType || selectedCities.length > 0 ? 'Попробуйте изменить фильтры' : 'Компании появятся в ближайшее время'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-white border-b border-dark-700 pb-4">
            {selectedSupplierType || selectedCities.length > 0 ? 
              `Поставщики (${companies.length})` : 
              `Все поставщики (${companies.length})`
            }
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <CompanyCard company={company} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-16 text-center"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-400 mb-2">{companies.length}</div>
            <div className="text-dark-300">Поставщиков</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-400 mb-2">{supplierTypes.length}</div>
            <div className="text-dark-300">Типов поставщиков</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
            <div className="text-dark-300">Поддержка</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Suppliers;