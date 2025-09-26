import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Clock, Tag, Edit2, Eye } from 'lucide-react';
import { Tender } from '../../types';

interface DashboardTenderCardProps {
  tender: Tender
  displayCurrency?: string
  convertedBudgetMin?: number | null
  convertedBudgetMax?: number | null
}

const DashboardTenderCard = ({ tender, displayCurrency, convertedBudgetMin, convertedBudgetMax }: DashboardTenderCardProps) => {
  const navigate = useNavigate();

  // Функция для редактирования тендера
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // предотвращаем всплытие события
    navigate(`/dashboard/tenders/edit/${tender.id}`);
  };

  // Функция для просмотра тендера
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation(); // предотвращаем всплытие события
    navigate(`/tenders/${tender.id}`);
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'RUB': return '₽';
      case 'KZT':
      default:
        return '₸';
    }
  };

  const formatBudget = () => {
    // Используем конвертированные значения если они переданы, иначе оригинальные
    const min = convertedBudgetMin !== undefined ? convertedBudgetMin : tender.budget_min;
    const max = convertedBudgetMax !== undefined ? convertedBudgetMax : tender.budget_max;
    const currency = displayCurrency || tender.currency;

    const symbol = getCurrencySymbol(currency);

    if (!min && !max) {
      return 'Бюджет не указан';
    }
    if (min && max) {
      return `${Math.round(min).toLocaleString()} - ${Math.round(max).toLocaleString()} ${symbol}`;
    }
    if (min) {
      return `от ${Math.round(min).toLocaleString()} ${symbol}`;
    }
    if (max) {
      return `до ${Math.round(max).toLocaleString()} ${symbol}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'Не указано';
    }
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getDaysLeft = (dateString?: string) => {
    if (!dateString) {
      return null;
    }
    const deadline = new Date(dateString);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Просрочен';
    }
    if (diffDays === 0) {
      return 'Сегодня';
    }
    if (diffDays === 1) {
      return '1 день';
    }
    if (diffDays < 5) {
      return `${diffDays} дня`;
    }
    return `${diffDays} дней`;
  };

  const getStatusBadge = () => {
    const statusConfig = {
      APPROVED: { text: 'Активный', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      REJECTED: { text: 'Отклонен', color: 'bg-red-500/20 text-red-400' },
    };

    const config = statusConfig[tender.status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const daysLeft = getDaysLeft(tender.deadline_date);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="card p-6 hover:shadow-glow transition-all duration-300 group"
    >
      {/* Header с кнопками управления */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors mb-2 line-clamp-2">
            {tender.title}
          </h3>
          <p className="text-dark-300 text-sm flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {tender.city}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge()}

          {/* Кнопки управления */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Кнопка редактирования - доступна для всех собственных тендеров */}
            <button
              onClick={handleEdit}
              className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
              title="Редактировать тендер"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Кнопка просмотра */}
            <button
              onClick={handleView}
              className="p-2 bg-dark-600 hover:bg-dark-500 text-white rounded-md transition-colors"
              title="Просмотреть тендер"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-dark-300 text-sm mb-4 line-clamp-3">
        {tender.description}
      </p>

      {/* Categories */}
      {tender.categories && tender.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tender.categories.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="px-2 py-1 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300 flex items-center"
            >
              <Tag className="w-3 h-3 mr-1" />
              {category.name}
            </span>
          ))}
          {tender.categories.length > 2 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-dark-600 text-dark-300">
              +{tender.categories.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Details */}
      <div className="space-y-3 mb-4">
        {/* Budget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-dark-300 text-sm">Бюджет:</span>
          </div>
          <span className="text-white font-medium text-sm">
            {formatBudget()}
          </span>
        </div>

        {/* Deadline */}
        {tender.deadline_date && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-dark-300 text-sm">Крайний срок:</span>
            </div>
            <span className="text-white font-medium text-sm">
              {formatDate(tender.deadline_date)}
            </span>
          </div>
        )}

        {/* Time left */}
        {daysLeft && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-dark-300 text-sm">Осталось:</span>
            </div>
            <span className={`font-medium text-sm ${
              daysLeft === 'Просрочен'
                ? 'text-red-400'
                : daysLeft === 'Сегодня' || daysLeft === '1 день'
                  ? 'text-yellow-400'
                  : 'text-white'
            }`}>
              {daysLeft}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-dark-700 flex justify-between items-center">
        <span className="text-dark-400 text-xs">
          Автор: {tender.author_name}
        </span>
        <span className="text-dark-400 text-xs">
          {new Date(tender.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>

      {/* Action hint */}
      <div className="mt-3 text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Редактировать или просмотреть →
      </div>
    </motion.div>
  );
};

export default DashboardTenderCard;