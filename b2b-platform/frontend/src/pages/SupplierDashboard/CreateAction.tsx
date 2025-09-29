import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Save, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ActionFormData {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const CreateAction: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ActionFormData>({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Partial<ActionFormData>>({});

  // Функция для валидации формы
  const validateForm = (): boolean => {
    const newErrors: Partial<ActionFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название акции обязательно';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание акции обязательно';
    }

    if (!formData.starts_at) {
      newErrors.starts_at = 'Дата начала обязательна';
    }

    if (!formData.ends_at) {
      newErrors.ends_at = 'Дата окончания обязательна';
    }

    // Проверяем, что дата окончания больше даты начала
    if (formData.starts_at && formData.ends_at) {
      const startDate = new Date(formData.starts_at);
      const endDate = new Date(formData.ends_at);

      if (endDate <= startDate) {
        newErrors.ends_at = 'Дата окончания должна быть позже даты начала';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик изменения полей формы
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Очищаем ошибку для этого поля при изменении
    if (errors[name as keyof ActionFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setIsLoading(true);

    try {
      // Форматируем даты для отправки на сервер
      const submitData = {
        ...formData,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
      };

      const response = await apiService.post('/ads/actions/', submitData);

      toast.success('Акция успешно создана!');
      navigate('/dashboard/actions');
    } catch (error: any) {
      console.error('Ошибка создания акции:', error);

      // Обработка ошибок валидации от сервера
      if (error?.response?.data) {
        const serverErrors = error.response.data;
        if (typeof serverErrors === 'object') {
          const formattedErrors: Partial<ActionFormData> = {};

          Object.keys(serverErrors).forEach(key => {
            if (key in formData) {
              formattedErrors[key as keyof ActionFormData] =
                Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
            }
          });

          setErrors(formattedErrors);
        }

        const errorMessage = serverErrors.error ||
                            serverErrors.detail ||
                            'Ошибка при создании акции';
        toast.error(errorMessage);
      } else {
        toast.error('Ошибка при создании акции');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для форматирования даты для input[type="datetime-local"]
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Устанавливаем минимальную дату (текущую)
  const minDateTime = formatDateTimeLocal(new Date());

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        {/* Заголовок с кнопкой назад */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard/actions')}
            className="flex items-center text-dark-300 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Zap className="w-8 h-8 mr-3 text-purple-400" />
              Создать акцию
            </h1>
            <p className="text-dark-300 text-lg mt-2">
              Привлекайте клиентов специальными предложениями
            </p>
          </div>
        </div>

        {/* Информационное сообщение */}
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-blue-300 font-medium mb-2">Советы для эффективной акции:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Укажите конкретные условия и сроки действия</li>
                <li>• Опишите выгоду для клиента</li>
                <li>• Добавьте контактную информацию для уточнений</li>
                <li>• Проверьте даты начала и окончания акции</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Форма создания акции */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название акции */}
          <div>
            <label className="block text-white font-medium mb-2">
              Название акции *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Например: Скидка 20% на все товары"
              className={`w-full px-4 py-3 rounded-lg border bg-dark-800 text-white placeholder-dark-400 transition-colors ${
                errors.title
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-dark-600 focus:border-primary-400'
              }`}
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Описание акции */}
          <div>
            <label className="block text-white font-medium mb-2">
              Описание акции *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Подробно опишите условия акции, что входит в предложение, как воспользоваться..."
              className={`w-full px-4 py-3 rounded-lg border bg-dark-800 text-white placeholder-dark-400 transition-colors resize-none ${
                errors.description
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-dark-600 focus:border-primary-400'
              }`}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Даты проведения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Дата начала */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Дата и время начала *
              </label>
              <input
                type="datetime-local"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleInputChange}
                min={minDateTime}
                className={`w-full px-4 py-3 rounded-lg border bg-dark-800 text-white transition-colors ${
                  errors.starts_at
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-dark-600 focus:border-primary-400'
                }`}
              />
              {errors.starts_at && (
                <p className="text-red-400 text-sm mt-1">{errors.starts_at}</p>
              )}
            </div>

            {/* Дата окончания */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Дата и время окончания *
              </label>
              <input
                type="datetime-local"
                name="ends_at"
                value={formData.ends_at}
                onChange={handleInputChange}
                min={formData.starts_at || minDateTime}
                className={`w-full px-4 py-3 rounded-lg border bg-dark-800 text-white transition-colors ${
                  errors.ends_at
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-dark-600 focus:border-primary-400'
                }`}
              />
              {errors.ends_at && (
                <p className="text-red-400 text-sm mt-1">{errors.ends_at}</p>
              )}
            </div>
          </div>

          {/* Статус активности */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              id="is_active"
              className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="ml-3 text-white">
              Активировать акцию сразу после создания
            </label>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/actions')}
              className="btn-outline"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Создание...' : 'Создать акцию'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAction;