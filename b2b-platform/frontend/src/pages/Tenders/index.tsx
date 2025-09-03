import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTenders } from '../../store/slices/tendersSlice';
import TenderCard from '../../components/TenderCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const Tenders = () => {
  const dispatch = useAppDispatch();
  const { tenders, isLoading } = useAppSelector(state => state.tenders);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    dispatch(fetchTenders({ page: 1, filters: { status: 'APPROVED' } }));
  }, [dispatch]);

  // Get unique cities from tenders
  const cities = [...new Set(tenders.map(tender => tender.city).filter(Boolean))];

  const filteredTenders = selectedCity 
    ? tenders.filter(tender => tender.city === selectedCity)
    : tenders;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">Тендеры</h1>
        <p className="text-xl text-dark-300 max-w-2xl mx-auto">
          Материалы, которые компании ищут для своих нужд
        </p>
      </motion.div>

      {/* City Filter */}
      {cities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => setSelectedCity('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCity === '' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              Все города
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCity === city 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tenders List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredTenders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {selectedCity ? 'Нет тендеров в этом городе' : 'Нет активных тендеров'}
          </h3>
          <p className="text-dark-300">
            {selectedCity ? 'Попробуйте выбрать другой город' : 'Новые тендеры появятся в ближайшее время'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTenders.map((tender, index) => (
            <motion.div
              key={tender.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <TenderCard tender={tender} />
            </motion.div>
          ))}
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
            <div className="text-3xl font-bold text-primary-400 mb-2">{tenders.length}</div>
            <div className="text-dark-300">Активных тендеров</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-400 mb-2">{cities.length}</div>
            <div className="text-dark-300">Городов</div>
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

export default Tenders;