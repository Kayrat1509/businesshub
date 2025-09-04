import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCompanies } from '../../store/slices/companiesSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import CompanyCard from '../../components/CompanyCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api';

const Suppliers = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { companies, isLoading } = useAppSelector(state => state.companies);
  const { categories, isLoading: categoriesLoading } = useAppSelector(state => state.categories);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch all companies and categories
    dispatch(fetchCompanies({ page: 1, filters: {} }));
    dispatch(fetchCategories());
    // Also fetch parent categories for dropdown
    fetchParentCategories();
  }, [dispatch]);

  const [parentCategories, setParentCategories] = useState<any[]>([]);

  const fetchParentCategories = async () => {
    try {
      const data = await apiService.get('/categories/tree/');
      setParentCategories(data);
    } catch (error) {
      console.error('Error fetching parent categories:', error);
    }
  };

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCompanies = selectedCategory 
    ? companies.filter(company => 
        company.categories?.some(cat => {
          // Direct match by category name
          if (cat.name === selectedCategory) return true;
          
          // Check if this is a child category of the selected parent category
          const selectedParent = parentCategories.find(p => p.name === selectedCategory);
          if (selectedParent) {
            // Check if company's category is a child of the selected parent
            return selectedParent.children?.some((child: any) => child.name === cat.name);
          }
          
          return false;
        }),
      )
    : companies;

  const getCompaniesForCategory = (categoryName: string) => {
    return companies.filter(company => 
      company.categories?.some(cat => {
        // Direct match by category name
        if (cat.name === categoryName) return true;
        
        // Check if this is a child category of the selected parent category
        const selectedParent = parentCategories.find(p => p.name === categoryName);
        if (selectedParent) {
          // Check if company's category is a child of the selected parent
          return selectedParent.children?.some((child: any) => child.name === cat.name);
        }
        
        return false;
      }),
    );
  };

  // Parent categories are loaded separately from the tree endpoint
  
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsDropdownOpen(false);
  };

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

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex justify-center mb-6">
          <div className="relative" ref={dropdownRef}>
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
                    onClick={() => handleCategorySelect('')}
                    className={`w-full text-left px-4 py-2 hover:bg-dark-700 transition-colors ${
                      selectedCategory === '' 
                        ? 'bg-primary-600 text-white' 
                        : 'text-dark-300'
                    }`}
                  >
                    Все категории
                  </button>
                  
                  {parentCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.name)}
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
        </div>
      </motion.div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {selectedCategory ? 'Нет поставщиков в этой категории' : 'Нет поставщиков'}
          </h3>
          <p className="text-dark-300">
            {selectedCategory ? 'Попробуйте выбрать другую категорию' : 'Поставщики появятся в ближайшее время'}
          </p>
        </motion.div>
      ) : selectedCategory ? (
        // Show filtered companies in 5-column grid when category is selected
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {filteredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <CompanyCard company={company} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        // Show all companies in a single grid
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-12"
        >
          {/* Show all companies in one grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white border-b border-dark-700 pb-4">
              Все поставщики ({companies.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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