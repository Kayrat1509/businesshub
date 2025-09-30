import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Plus, Calendar, Clock, Edit3, Trash2, Eye, Users, CheckCircle, XCircle, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Action {
  id: number;
  title: string;
  description: string;
  company_name: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  is_current: boolean;
  created_at: string;
}

const DashboardActions: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка акций пользователя
  const loadActions = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.get<{ results: Action[] }>('/ads/actions/my/');
      console.log('Полученные данные акций:', data); // Для отладки

      // API возвращает объект с полем results, содержащим массив
      if (data && data.results && Array.isArray(data.results)) {
        setActions(data.results);
      } else if (Array.isArray(data)) {
        // Резервный случай, если API вернет прямой массив
        setActions(data);
      } else {
        console.error('Неожиданная структура ответа:', data);
        setActions([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки акций:', error);
      toast.error('Ошибка при загрузке акций');
      setActions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  // Удаление акции
  const handleDelete = async (actionId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту акцию?')) {
      return;
    }

    try {
      await apiService.delete(`/ads/actions/${actionId}/`);
      toast.success('Акция успешно удалена');
      loadActions(); // Перезагружаем список
    } catch (error: any) {
      console.error('Ошибка удаления акции:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при удалении акции';
      toast.error(errorMessage);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Получение статуса акции
  const getActionStatus = (action: Action) => {
    const now = new Date();
    const startDate = new Date(action.starts_at);
    const endDate = new Date(action.ends_at);

    if (!action.is_active) {
      return { text: 'Отключена', color: 'bg-gray-500/20 text-gray-400', icon: XCircle };
    }

    if (now < startDate) {
      return { text: 'Запланирована', color: 'bg-blue-500/20 text-blue-400', icon: Clock };
    }

    if (now >= startDate && now <= endDate) {
      return { text: 'Активна', color: 'bg-green-500/20 text-green-400', icon: CheckCircle };
    }

    return { text: 'Завершена', color: 'bg-red-500/20 text-red-400', icon: XCircle };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Zap className="w-8 h-8 mr-3 text-purple-400" />
              Мои акции
            </h1>
            <p className="text-dark-300 text-lg">
              Управляйте акциями и специальными предложениями для привлечения клиентов
            </p>
          </div>
          <Link
            to="/dashboard/actions/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Создать акцию</span>
          </Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Всего акций</p>
                <p className="text-2xl font-bold text-white">{actions.length}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Активных</p>
                <p className="text-2xl font-bold text-white">
                  {actions.filter(action => action.is_current).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Запланированных</p>
                <p className="text-2xl font-bold text-white">
                  {actions.filter(action => {
                    const now = new Date();
                    const startDate = new Date(action.starts_at);
                    return action.is_active && now < startDate;
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">Просмотров</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <Eye className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Список акций */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        {actions.length > 0 ? (
          <div className="space-y-4">
            {actions.map((action) => {
              const status = getActionStatus(action);
              const StatusIcon = status.icon;

              return (
                <div
                  key={action.id}
                  className="border border-dark-700 rounded-lg p-6 hover:border-dark-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Заголовок и статус */}
                      <div className="flex items-center mb-3">
                        <h3 className="text-xl font-semibold text-white mr-4">
                          {action.title}
                        </h3>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${status.color}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.text}
                        </span>
                      </div>

                      {/* Описание */}
                      <p className="text-dark-300 mb-4 line-clamp-3">
                        {action.description}
                      </p>

                      {/* Даты */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-dark-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Начало: {formatDate(action.starts_at)}</span>
                        </div>
                        <div className="flex items-center text-dark-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Окончание: {formatDate(action.ends_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/dashboard/actions/${action.id}/products`}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Управление товарами"
                      >
                        <Package className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/dashboard/actions/edit/${action.id}`}
                        className="p-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(action.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              У вас пока нет акций
            </h3>
            <p className="text-dark-300 mb-6">
              Создайте первую акцию, чтобы привлечь больше клиентов
            </p>
            <Link to="/dashboard/actions/create" className="btn-primary">
              Создать первую акцию
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardActions;
