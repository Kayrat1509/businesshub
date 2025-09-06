import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import CompanyCard from '../../components/CompanyCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api';
import { Company } from '../../types';

interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[];
}

const Suppliers = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Load companies
        await loadCompanies();
        
        // Load categories
        const categoriesResponse = await apiService.get('/categories/tree/');
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        setCompanies([]);
        setCategories([]);
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

  const loadCompanies = async (categoryFilter = '', cityFilter = '') => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (cityFilter) params.append('city', cityFilter);
      
      const queryString = params.toString();
      const endpoint = `/companies/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get(endpoint);
      const companiesData = response?.results || response?.data || response || [];
      
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  };

  const handleCategoryChange = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsDropdownOpen(false);
    setIsLoading(true);
    
    try {
      await loadCompanies(categoryName, selectedCity);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    setIsLoading(true);
    
    try {
      await loadCompanies(selectedCategory, city);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('category-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

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
        <div className="flex justify-center mb-6 space-x-4">
          {/* Category Filter */}
          <div className="relative" id="category-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-6 py-3 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors min-w-[250px] justify-between"
            >
              <span>{selectedCategory || 'Все категории'}</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-dark-800 rounded-lg border border-dark-700 shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="py-2">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-4 py-2 hover:bg-dark-700 transition-colors ${
                      selectedCategory === '' 
                        ? 'bg-primary-600 text-white' 
                        : 'text-dark-300'
                    }`}
                  >
                    Все категории
                  </button>
                  
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.name)}
                      className={`w-full text-left px-4 py-2 hover:bg-dark-700 transition-colors ${
                        selectedCategory === category.name 
                          ? 'bg-primary-600 text-white' 
                          : 'text-dark-300'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="px-6 py-3 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors min-w-[200px] border border-dark-700"
          >
            <option value="">Все города</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
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
            {selectedCategory || selectedCity ? 'Нет поставщиков по выбранным фильтрам' : 'Нет компаний'}
          </h3>
          <p className="text-dark-300">
            {selectedCategory || selectedCity ? 'Попробуйте изменить фильтры' : 'Компании появятся в ближайшее время'}
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
            {selectedCategory || selectedCity ? 
              `Поставщики (${companies.length})` : 
              `Все поставщики (${companies.length})`
            }
          </h3>
          
          <div className="grid grid-cols-6 gap-4">
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
            <div className="text-3xl font-bold text-secondary-400 mb-2">{categories.length}</div>
            <div className="text-dark-300">Категорий</div>
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