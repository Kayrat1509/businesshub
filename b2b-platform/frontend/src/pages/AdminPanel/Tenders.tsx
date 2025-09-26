import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTenders } from '../../store/slices/tendersSlice';
import { Tender } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import apiService from '../../api';

const AdminTenders = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tenders, isLoading } = useAppSelector(state => state.tenders);

  // Состояния для фильтрации и поиска тендеров
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTenders, setSelectedTenders] = useState<number[]>([]);

  // Загружаем все тендеры при инициализации компонента
  useEffect(() => {
    dispatch(fetchTenders({ page: 1, filters: {} }));
  }, [dispatch]);

  // Функция для получения стиля статуса тендера
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      APPROVED: { text: 'Одобрен', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      REJECTED: { text: 'Отклонен', color: 'bg-red-500/20 text-red-400', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color} flex items-center`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Функция для изменения статуса тендера
  const handleStatusChange = async (tenderId: number, newStatus: string) => {
    try {
      await apiService.patch(`/admin/tenders/${tenderId}/`, { status: newStatus });
      toast.success('Статус тендера обновлен');
      // Перезагружаем список тендеров
      dispatch(fetchTenders({ page: 1, filters: {} }));
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast.error('Ошибка обновления статуса тендера');
    }
  };

  // Функция для удаления тендера
  const handleDeleteTender = async (tenderId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тендер?')) return;

    try {
      await apiService.delete(`/admin/tenders/${tenderId}/`);
      toast.success('Тендер удален');
      dispatch(fetchTenders({ page: 1, filters: {} }));
    } catch (error) {
      console.error('Ошибка удаления тендера:', error);
      toast.error('Ошибка удаления тендера');
    }
  };

  // Фильтрация тендеров по поисковому запросу и статусу
  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.author_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || tender.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Функция для форматирования бюджета
  const formatBudget = (tender: Tender) => {
    const getCurrencySymbol = (currency?: string) => {
      switch (currency) {
        case 'USD': return '$';
        case 'RUB': return '₽';
        case 'KZT':
        default: return '₸';
      }
    };

    const symbol = getCurrencySymbol(tender.currency);

    if (!tender.budget_min && !tender.budget_max) {
      return 'Не указан';
    }
    if (tender.budget_min && tender.budget_max) {
      return `${tender.budget_min.toLocaleString('ru-RU')} - ${tender.budget_max.toLocaleString('ru-RU')} ${symbol}`;
    }
    if (tender.budget_min) {
      return `от ${tender.budget_min.toLocaleString('ru-RU')} ${symbol}`;
    }
    if (tender.budget_max) {
      return `до ${tender.budget_max.toLocaleString('ru-RU')} ${symbol}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление тендерами</h1>
          <p className="text-dark-300">Модерация и управление тендерами платформы</p>
        </div>
        <button
          onClick={() => navigate('/admin/tenders/create')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Создать тендер</span>
        </button>
      </motion.div>

      {/* Панель поиска и фильтров */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Поиск */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по названию или автору..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Фильтр по статусу */}
          <div className="md:w-48">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Все статусы</option>
              <option value="PENDING">На модерации</option>
              <option value="APPROVED">Одобрено</option>
              <option value="REJECTED">Отклонено</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Список тендеров */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredTenders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Тендеры не найдены</h3>
            <p className="text-dark-300">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Попробуйте изменить критерии поиска'
                : 'Тендеры еще не были созданы'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTenders.map((tender) => (
              <div
                key={tender.id}
                className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Заголовок и статус */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                          {tender.title}
                        </h3>
                        <p className="text-dark-300 text-sm line-clamp-2 mb-2">
                          {tender.description}
                        </p>
                      </div>
                      {getStatusBadge(tender.status)}
                    </div>

                    {/* Детали тендера */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-dark-400" />
                        <span className="text-dark-300">{tender.city}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-dark-400" />
                        <span className="text-dark-300">{formatBudget(tender)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-dark-400" />
                        <span className="text-dark-300">
                          {new Date(tender.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      {/* Контактный телефон, если указан */}
                      {tender.contact_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-primary-400" />
                          <span className="text-primary-400">{tender.contact_phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Автор тендера */}
                    <div className="mt-2 text-sm text-dark-400">
                      Автор: {tender.author_name}
                      {tender.company && ` • ${tender.company.name}`}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Кнопки изменения статуса */}
                    {tender.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(tender.id, 'APPROVED')}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Одобрить"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(tender.id, 'REJECTED')}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Отклонить"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Просмотр */}
                    <button
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Просмотреть"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Редактирование */}
                    <button
                      onClick={() => navigate(`/admin/tenders/${tender.id}/edit`)}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Удаление */}
                    <button
                      onClick={() => handleDeleteTender(tender.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Статистика */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="card p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {tenders.length}
          </div>
          <div className="text-dark-300 text-sm">Всего тендеров</div>
        </div>

        <div className="card p-4">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {tenders.filter(t => t.status === 'PENDING').length}
          </div>
          <div className="text-dark-300 text-sm">На модерации</div>
        </div>

        <div className="card p-4">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {tenders.filter(t => t.status === 'APPROVED').length}
          </div>
          <div className="text-dark-300 text-sm">Одобрено</div>
        </div>

        <div className="card p-4">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {tenders.filter(t => t.status === 'REJECTED').length}
          </div>
          <div className="text-dark-300 text-sm">Отклонено</div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminTenders;
