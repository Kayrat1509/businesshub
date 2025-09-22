import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Building2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCompanies } from '../../store/slices/companiesSlice';
import { motion } from 'framer-motion';

const Search: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const { companies, loading } = useAppSelector((state) => state.companies);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
  }, [searchParams]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      await dispatch(fetchCompanies({ page: 1, filters: { q: query } })).unwrap();
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Поиск поставщиков</h1>
        
        <form onSubmit={handleSubmit} className="relative max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              id="search-companies"
              name="searchCompanies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию компании, услугам или товарам..."
              className="w-full pl-12 pr-4 py-4 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Поиск...' : 'Найти'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {loading || isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-dark-300 mt-4">Поиск...</p>
        </div>
      ) : companies.length > 0 ? (
        <div>
          <p className="text-dark-300 mb-6">
            Найдено результатов: {companies.length}
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-lg p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {company.name}
                    </h3>
                    {company.city && (
                      <div className="flex items-center text-dark-300 text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {company.city}
                      </div>
                    )}
                  </div>
                  {company.logo && (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>

                <p className="text-dark-300 text-sm mb-4 line-clamp-3">
                  {company.description}
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex items-center text-dark-400 text-sm">
                    <Building2 className="w-4 h-4 mr-1" />
                    {company.categories?.[0]?.name || 'Без категории'}
                  </div>
                  <Link
                    to={`/company/${company.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Подробнее
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-300 mb-2">
            Результаты не найдены
          </h2>
          <p className="text-dark-400">
            Попробуйте изменить запрос или использовать другие ключевые слова
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-300 mb-2">
            Введите запрос для поиска
          </h2>
          <p className="text-dark-400">
            Найдите нужных поставщиков по названию компании или услугам
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;