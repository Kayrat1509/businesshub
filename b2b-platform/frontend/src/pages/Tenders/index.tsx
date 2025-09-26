import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTenders } from '../../store/slices/tendersSlice';
import TenderCard from '../../components/TenderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Tender } from '../../types';

const Tenders = () => {
  const dispatch = useAppDispatch();
  const { tenders, isLoading } = useAppSelector(state => state.tenders);

  // Состояния для фильтров и сортировки
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KZT');
  const [searchInTitles, setSearchInTitles] = useState<string>('all'); // для аналогии с товарами
  const [sortOrder, setSortOrder] = useState<string>('');

  useEffect(() => {
    dispatch(fetchTenders({ page: 1, filters: { status: 'APPROVED' } }));
  }, [dispatch]);

  // Получаем уникальные города из тендеров
  const cities = [...new Set(tenders.map(tender => tender.city).filter(Boolean))].sort();

  // Функция для получения отображаемого бюджета в выбранной валюте
  const getDisplayBudget = (tender: Tender) => {
    // Курсы валют относительно тенге (сколько KZT за 1 единицу валюты)
    const exchangeRates = {
      KZT: 1,      // базовая валюта - казахстанский тенге
      USD: 450,    // 1 USD = 450 KZT
      RUB: 5.0     // 1 RUB = 5.0 KZT
    };

    const convertPrice = (price: number, fromCurrency: string, toCurrency: string) => {
      if (fromCurrency === toCurrency) return price;

      // Получаем курсы для исходной и целевой валют
      const fromRate = exchangeRates[fromCurrency as keyof typeof exchangeRates];
      const toRate = exchangeRates[toCurrency as keyof typeof exchangeRates];

      // Если какой-то курс не найден, возвращаем исходную цену
      if (!fromRate || !toRate) return price;

      // Сначала конвертируем исходную валюту в тенге
      const priceInKZT = price * fromRate;
      // Затем конвертируем из тенге в целевую валюту
      const priceInTargetCurrency = priceInKZT / toRate;

      return priceInTargetCurrency;
    };

    const budgetMin = tender.budget_min ? convertPrice(tender.budget_min, tender.currency, selectedCurrency) : null;
    const budgetMax = tender.budget_max ? convertPrice(tender.budget_max, tender.currency, selectedCurrency) : null;

    return { budgetMin, budgetMax };
  };

  // Функция для фильтрации и сортировки тендеров
  const applyFiltersAndSort = (tendersList: Tender[]): Tender[] => {
    let filtered = [...tendersList];

    // Фильтрация по городу
    if (selectedCity) {
      filtered = filtered.filter(tender => tender.city === selectedCity);
    }

    // Фильтрация по типу показа тендеров
    if (searchInTitles === 'with_deadline') {
      filtered = filtered.filter(tender => tender.deadline_date);
    } else if (searchInTitles === 'with_budget') {
      filtered = filtered.filter(tender => tender.budget_min || tender.budget_max);
    }

    // Сортировка
    if (sortOrder === 'budget_asc') {
      filtered.sort((a, b) => {
        const { budgetMin: minA } = getDisplayBudget(a);
        const { budgetMin: minB } = getDisplayBudget(b);
        const avgA = minA || 0;
        const avgB = minB || 0;
        return avgA - avgB;
      });
    } else if (sortOrder === 'budget_desc') {
      filtered.sort((a, b) => {
        const { budgetMin: minA } = getDisplayBudget(a);
        const { budgetMin: minB } = getDisplayBudget(b);
        const avgA = minA || 0;
        const avgB = minB || 0;
        return avgB - avgA;
      });
    } else if (sortOrder === 'date_desc') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'deadline_asc') {
      filtered.sort((a, b) => {
        if (!a.deadline_date && !b.deadline_date) return 0;
        if (!a.deadline_date) return 1;
        if (!b.deadline_date) return -1;
        return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      });
    }

    return filtered;
  };

  const filteredTenders = applyFiltersAndSort(tenders);

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

      {/* Фильтры и сортировка */}
      {tenders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-dark-700/50 rounded-lg">
            {/* Фильтр по городу */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Фильтр по городу:
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Все города</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Валюта отображения */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Валюта отображения:
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="KZT">Тенге (KZT)</option>
                <option value="RUB">Рубли (RUB)</option>
                <option value="USD">Доллары (USD)</option>
              </select>
            </div>

            {/* Поиск выполнен (адаптированно для тендеров) */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Показать тендеры:
              </label>
              <select
                value={searchInTitles}
                onChange={(e) => setSearchInTitles(e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Показать все</option>
                <option value="with_deadline">С указанным дедлайном</option>
                <option value="with_budget">С указанным бюджетом</option>
              </select>
            </div>

            {/* Сортировка */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Сортировка:
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">По умолчанию</option>
                <option value="date_desc">Сначала новые</option>
                <option value="budget_asc">Бюджет: от меньшего к большему</option>
                <option value="budget_desc">Бюджет: от большего к меньшему</option>
                <option value="deadline_asc">По дедлайну</option>
              </select>
            </div>

            {/* Счётчик результатов */}
            <div className="flex items-end">
              <div className="text-sm text-dark-400">
                Показано: <span className="text-primary-400 font-semibold">{filteredTenders.length}</span> из <span className="text-white">{tenders.length}</span> тендеров
              </div>
            </div>
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
          {filteredTenders.map((tender, index) => {
            // Получаем конвертированные бюджеты для каждого тендера
            const { budgetMin, budgetMax } = getDisplayBudget(tender);

            return (
              <motion.div
                key={tender.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <TenderCard
                  tender={tender}
                  displayCurrency={selectedCurrency}
                  convertedBudgetMin={budgetMin}
                  convertedBudgetMax={budgetMax}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-16 text-center"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-400 mb-2">{filteredTenders.length}</div>
            <div className="text-dark-300">Показано тендеров</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-400 mb-2">{tenders.length}</div>
            <div className="text-dark-300">Всего активных</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{cities.length}</div>
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