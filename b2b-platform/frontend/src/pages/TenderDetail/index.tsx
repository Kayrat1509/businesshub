import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Tag,
  User,
  Phone,
  Mail,
  FileText,
  Download
} from 'lucide-react';
import { Tender } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api';
import { toast } from 'react-hot-toast';

const TenderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tender, setTender] = useState<Tender | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем данные тендера при монтировании компонента
  useEffect(() => {
    if (id) {
      loadTenderDetails(Number(id));
    }
  }, [id]);

  // Функция для загрузки детальной информации о тендере
  const loadTenderDetails = async (tenderId: number) => {
    try {
      setIsLoading(true);
      // Загружаем данные тендера через API
      const response = await apiService.get<Tender>(`/tenders/${tenderId}/`);
      setTender(response);
    } catch (error: any) {
      console.error('Ошибка загрузки тендера:', error);
      toast.error('Ошибка загрузки тендера');
      // Возвращаемся к списку тендеров при ошибке
      navigate('/tenders');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для получения символа валюты
  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'RUB': return '₽';
      case 'KZT':
      default: return '₸';
    }
  };

  // Функция для форматирования бюджета тендера
  const formatBudget = (min?: number, max?: number, currency?: string) => {
    const symbol = getCurrencySymbol(currency);

    if (!min && !max) {
      return 'Бюджет не указан';
    }
    if (min && max) {
      return `${min.toLocaleString('ru-RU')} - ${max.toLocaleString('ru-RU')} ${symbol}`;
    }
    if (min) {
      return `от ${min.toLocaleString('ru-RU')} ${symbol}`;
    }
    if (max) {
      return `до ${max.toLocaleString('ru-RU')} ${symbol}`;
    }
  };

  // Функция для получения статуса тендера с соответствующим стилем
  const getStatusBadge = () => {
    if (!tender) return null;

    const statusConfig = {
      APPROVED: { text: 'Активный', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      REJECTED: { text: 'Отклонен', color: 'bg-red-500/20 text-red-400' },
    };

    const config = statusConfig[tender.status];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Функция для расчета оставшихся дней до дедлайна
  const getDaysLeft = (dateString?: string) => {
    if (!dateString) return null;

    const deadline = new Date(dateString);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Просрочен';
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return '1 день';
    if (diffDays < 5) return `${diffDays} дня`;
    return `${diffDays} дней`;
  };

  // Функция для открытия карточки компании-инициатора
  const handleCompanyClick = () => {
    if (tender?.company?.id) {
      navigate(`/company/${tender.company.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Тендер не найден</h1>
          <Link to="/tenders" className="btn-primary px-6 py-3">
            Вернуться к тендерам
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(tender.deadline_date);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Кнопка возврата */}
      <Link
        to="/tenders"
        className="inline-flex items-center space-x-2 text-dark-300 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад к тендерам</span>
      </Link>

      {/* Заголовок тендера */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-3xl font-bold text-white">{tender.title}</h1>
              {getStatusBadge()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-dark-400" />
                <span className="text-dark-300">Город: {tender.city}</span>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-dark-400" />
                <span className="text-dark-300">
                  Создано: {new Date(tender.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>

              {tender.deadline_date && (
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-dark-400" />
                  <span className="text-dark-300">
                    Дедлайн: {new Date(tender.deadline_date).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}

              {daysLeft && (
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className={`font-medium ${
                    daysLeft === 'Просрочен'
                      ? 'text-red-400'
                      : daysLeft === 'Сегодня' || daysLeft === '1 день'
                        ? 'text-yellow-400'
                        : 'text-white'
                  }`}>
                    Осталось: {daysLeft}
                  </span>
                </div>
              )}
            </div>

            {/* Бюджет */}
            <div className="bg-dark-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <div>
                  <div className="text-dark-300 text-sm">Бюджет</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatBudget(tender.budget_min, tender.budget_max, tender.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Информация о компании */}
          {tender.company && (
            <div className="lg:ml-8 lg:min-w-[300px]">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Компания-инициатор</h3>
                <div
                  className="flex items-center space-x-4 cursor-pointer hover:bg-dark-700 rounded-lg p-3 -m-3 transition-colors"
                  onClick={handleCompanyClick}
                >
                  {tender.company.logo ? (
                    <img
                      src={tender.company.logo}
                      alt={tender.company.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-dark-600 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-dark-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-white font-medium hover:text-primary-400 transition-colors">
                      {tender.company.name}
                    </div>
                    <div className="text-dark-400 text-sm">Посмотреть компанию →</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Детальная информация */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Описание */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Описание тендера</h3>
            <div className="text-dark-200 leading-relaxed whitespace-pre-wrap">
              {tender.description}
            </div>
          </motion.div>

          {/* Категории */}
          {tender.categories && tender.categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Категории</h3>
              <div className="flex flex-wrap gap-2">
                {tender.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-3 py-1 text-sm font-medium rounded-full bg-secondary-500/20 text-secondary-300 flex items-center"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {category.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Прикрепленные файлы */}
          {tender.tender_attachments && tender.tender_attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Прикрепленные файлы</h3>
              <div className="space-y-3">
                {tender.tender_attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file}
                    download={attachment.filename}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-primary-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{attachment.filename}</div>
                      <div className="text-dark-400 text-sm">
                        {(attachment.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-dark-400" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Дополнительная информация */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Контактная информация</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-dark-400" />
                <span className="text-dark-300">Автор: {tender.author_name}</span>
              </div>

              {/* Отображение контактного телефона автора тендера */}
              {tender.contact_phone ? (
                <a
                  href={`tel:${tender.contact_phone}`}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary-400" />
                  <div>
                    <div className="text-white font-medium">Контактный телефон</div>
                    <div className="text-primary-400">{tender.contact_phone}</div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700/50">
                  <Phone className="w-4 h-4 text-dark-500" />
                  <div>
                    <div className="text-dark-400 font-medium">Контактный телефон</div>
                    <div className="text-dark-500">Не указан</div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          {/* Комментарий администратора */}
          {tender.admin_comment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Комментарий администратора</h3>
              <div className="text-dark-200 leading-relaxed">
                {tender.admin_comment}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderDetail;