import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Package, Save, ArrowLeft } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api'; // Для загрузки категорий и данных тендера
import { tenderService } from '../../services/tenderService'; // Сервис для обновления тендеров
import { fetchMyTenders } from '../../store/slices/tendersSlice'; // Для обновления списка после редактирования
import { Category } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

// Интерфейс формы редактирования тендера - соответствует полям backend модели Tender
interface TenderForm {
  title: string // Название тендера (обязательное поле)
  description: string // Подробное описание требований (обязательное поле)
  categories: number[] // Массив ID категорий (обязательное поле)
  city: string // Город поставки (опциональное поле)
  deadline_date: string // Крайний срок в формате YYYY-MM-DD (опциональное поле)
  budget_min: string // Минимальный бюджет - снято ограничение на количество цифр (опциональное поле)
  budget_max: string // Максимальный бюджет - снято ограничение на количество цифр (опциональное поле)
  currency: string // Валюта бюджета (KZT, USD, RUB)
  contact_phone: string // Контактный телефон для связи с автором тендера (опциональное поле)
}

const EditTender = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch(); // Для обновления Redux state после редактирования тендера
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<TenderForm>({
    title: '',
    description: '',
    categories: [],
    city: '',
    deadline_date: '',
    budget_min: '',
    budget_max: '',
    currency: 'KZT', // По умолчанию KZT
    contact_phone: '', // Поле для контактного телефона
  });

  // Загрузка категорий и данных тендера при инициализации компонента
  useEffect(() => {
    loadCategories();
    if (id) {
      loadTenderData(id);
    }
  }, [id]);

  // Функция загрузки категорий
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await apiService.get('/categories/');
      console.log('Loaded categories:', response);

      // Обрабатываем ответ - может быть массивом или объектом с results
      let categoriesData = response;
      if (response && typeof response === 'object' && response.results) {
        categoriesData = response.results;
      }

      // Убеждаемся что это массив
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        console.error('Categories response is not an array:', categoriesData);
        setCategories([]);
        toast.error('Ошибка формата данных категорий');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Устанавливаем пустой массив при ошибке
      toast.error('Ошибка загрузки категорий');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Функция загрузки данных тендера для редактирования
  const loadTenderData = async (tenderId: string) => {
    try {
      setIsLoading(true);
      // Сначала пытаемся загрузить через endpoint для собственных тендеров
      let response;
      try {
        response = await apiService.get(`/tenders/my/${tenderId}/`);
      } catch (error: any) {
        // Если не найден через my/, пробуем общий endpoint
        if (error.response?.status === 404) {
          response = await apiService.get(`/tenders/${tenderId}/`);
        } else {
          throw error;
        }
      }
      console.log('Loaded tender data:', response);

      // Заполняем форму данными тендера
      setFormData({
        title: response.title || '',
        description: response.description || '',
        categories: response.categories ? response.categories.map((cat: any) => cat.id) : [],
        city: response.city || '',
        deadline_date: response.deadline_date ? response.deadline_date.split('T')[0] : '', // Преобразуем в формат YYYY-MM-DD
        budget_min: response.budget_min ? response.budget_min.toString() : '',
        budget_max: response.budget_max ? response.budget_max.toString() : '',
        currency: response.currency || 'KZT',
        contact_phone: response.contact_phone || '',
      });
    } catch (error) {
      console.error('Error loading tender data:', error);
      toast.error('Ошибка загрузки данных тендера');
      navigate('/dashboard/tenders'); // Возвращаемся к списку при ошибке
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик изменения значений формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчик изменения категорий (мультивыбор)
  const handleCategoryChange = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId) // Убираем если уже выбрана
        : [...prev.categories, categoryId] // Добавляем если не выбрана
    }));
  };

  // Валидация формы перед отправкой
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Введите название тендера');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Введите описание тендера');
      return false;
    }
    if (formData.categories.length === 0) {
      toast.error('Выберите хотя бы одну категорию');
      return false;
    }

    // Валидация бюджета
    const budgetMin = formData.budget_min ? parseFloat(formData.budget_min) : null;
    const budgetMax = formData.budget_max ? parseFloat(formData.budget_max) : null;

    if (budgetMin && budgetMin < 0) {
      toast.error('Минимальный бюджет не может быть отрицательным');
      return false;
    }
    if (budgetMax && budgetMax < 0) {
      toast.error('Максимальный бюджет не может быть отрицательным');
      return false;
    }
    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      toast.error('Минимальный бюджет не может быть больше максимального');
      return false;
    }

    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Подготавливаем данные для отправки
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categories: formData.categories,
        city: formData.city.trim() || undefined, // Отправляем undefined если пустая строка
        deadline_date: formData.deadline_date || undefined, // Отправляем undefined если не задано
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        currency: formData.currency,
        contact_phone: formData.contact_phone.trim() || undefined, // Отправляем undefined если пустая строка
      };

      console.log('Submitting tender update:', submitData);
      console.log('Tender ID for update:', id);

      // Отправляем обновленные данные тендера
      const response = await tenderService.updateTender(id!, submitData);
      console.log('Tender updated successfully:', response);

      toast.success('Тендер успешно обновлен!');

      // Обновляем список тендеров в Redux
      dispatch(fetchMyTenders({ page: 1, filters: {} }));

      // Переходим обратно к списку тендеров
      navigate('/dashboard/tenders');

    } catch (error: any) {
      console.error('Error updating tender:', error);

      // Специальная обработка ошибки 404
      if (error.response?.status === 404) {
        toast.error('Тендер не найден или у вас нет прав на его редактирование');
        navigate('/dashboard/tenders'); // Возвращаемся к списку
        return;
      }

      // Обработка ошибок валидации от сервера
      if (error.response?.data) {
        const errorData = error.response.data;
        console.log('Server validation errors:', errorData);

        // Показываем первую ошибку валидации
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError)) {
          toast.error(firstError[0]);
        } else {
          toast.error(firstError || 'Ошибка при обновлении тендера');
        }
      } else {
        toast.error('Ошибка при обновлении тендера');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если загружаются данные
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <button
          onClick={() => navigate('/dashboard/tenders')}
          className="btn-ghost flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к тендерам</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Редактирование тендера</h1>
          <p className="text-dark-300">Обновите информацию о вашем тендере</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Название тендера *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input w-full"
              placeholder="Кратко опишите что вам нужно..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Подробное описание *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="input w-full"
              placeholder="Подробно опишите ваши требования, технические характеристики, условия поставки..."
              required
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Категории товаров/услуг *
            </label>
            {isLoadingCategories ? (
              <div className="flex justify-center p-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-dark-600 rounded-lg p-4">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((category) => (
                    <label key={category.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        className="checkbox"
                      />
                      <span className="text-dark-300">{category.name}</span>
                    </label>
                  ))
                ) : (
                  <div className="col-span-full text-center text-dark-400 py-4">
                    Категории не загружены
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-dark-400 mt-1">
              Выберите категории, которые наиболее точно описывают нужные вам товары или услуги
            </p>
          </div>

          {/* City and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-white mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Город поставки
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Алматы, Астана, Шымкент..."
              />
            </div>

            {/* Deadline Date */}
            <div>
              <label htmlFor="deadline_date" className="block text-sm font-medium text-white mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Крайний срок подачи предложений
              </label>
              <input
                type="date"
                id="deadline_date"
                name="deadline_date"
                value={formData.deadline_date}
                onChange={handleInputChange}
                className="input w-full"
                min={new Date().toISOString().split('T')[0]} // Не даем выбирать прошедшие даты
              />
            </div>
          </div>

          {/* Budget Row */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Бюджет
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Budget Min */}
              <div>
                <input
                  type="number"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Минимальный бюджет"
                  min="0"
                  step="1"
                />
              </div>

              {/* Budget Max */}
              <div>
                <input
                  type="number"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Максимальный бюджет"
                  min="0"
                  step="1"
                />
              </div>

              {/* Currency */}
              <div>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="KZT">Тенге (₸)</option>
                  <option value="USD">Доллары ($)</option>
                  <option value="RUB">Рубли (₽)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-dark-400 mt-1">
              Укажите ваш приблизительный бюджет. Это поможет поставщикам лучше понять ваши ожидания
            </p>
          </div>

          {/* Contact Phone */}
          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium text-white mb-2">
              Контактный телефон
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleInputChange}
              className="input w-full"
              placeholder="+7 (777) 123-45-67"
            />
            <p className="text-xs text-dark-400 mt-1">
              Телефон для связи с вами по этому тендеру (может отличаться от основного телефона в профиле)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tenders')}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditTender;