import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Package, Save, ArrowLeft, User } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import { Category, Tender } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

// Интерфейс формы создания/редактирования тендера в админ-панели
interface AdminTenderForm {
  title: string // Название тендера (обязательное поле)
  description: string // Подробное описание требований (обязательное поле)
  categories: number[] // Массив ID категорий (обязательное поле)
  city: string // Город поставки (опциональное поле)
  deadline_date: string // Крайний срок в формате YYYY-MM-DD (опциональное поле)
  budget_min: string // Минимальный бюджет (опциональное поле)
  budget_max: string // Максимальный бюджет (опциональное поле)
  currency: string // Валюта бюджета (KZT, USD, RUB)
  contact_phone: string // Контактный телефон для связи с автором тендера (опциональное поле)
  author_name: string // Имя автора тендера (для админов обязательное поле)
  status: string // Статус тендера (PENDING, APPROVED, REJECTED)
  admin_comment: string // Комментарий администратора (опциональное поле)
}

const CreateEditTender = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);

  // Состояния компонента
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Определяем режим работы: создание или редактирование
  const isEditMode = Boolean(id);

  // Состояние формы с начальными значениями
  const [formData, setFormData] = useState<AdminTenderForm>({
    title: '',
    description: '',
    categories: [],
    city: '',
    deadline_date: '',
    budget_min: '',
    budget_max: '',
    currency: 'KZT', // По умолчанию KZT
    contact_phone: '', // Поле для контактного телефона
    author_name: '', // Имя автора - обязательно для админов
    status: 'PENDING', // По умолчанию на модерации
    admin_comment: '', // Комментарий администратора
  });

  // Загрузка категорий при инициализации компонента
  useEffect(() => {
    loadCategories();
  }, []);

  // Загрузка данных тендера для редактирования
  useEffect(() => {
    if (isEditMode && id) {
      loadTenderData(Number(id));
    }
  }, [isEditMode, id]);

  // Функция загрузки категорий через единый API слой
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const data = await apiService.get<{ results: Category[] }>('/categories/');

      if (data && Array.isArray(data.results)) {
        setCategories(data.results);
      } else {
        console.error('Получены некорректные данные категорий:', data);
        setCategories([]);
        toast.error('Получены некорректные данные категорий');
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setCategories([]);
      toast.error('Ошибка загрузки категорий');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Функция загрузки данных тендера для редактирования
  const loadTenderData = async (tenderId: number) => {
    try {
      setIsLoading(true);
      const tender = await apiService.get<Tender>(`/admin/tenders/${tenderId}/`);

      // Заполняем форму данными загруженного тендера
      setFormData({
        title: tender.title,
        description: tender.description,
        categories: tender.categories.map(cat => cat.id),
        city: tender.city,
        deadline_date: tender.deadline_date || '',
        budget_min: tender.budget_min?.toString() || '',
        budget_max: tender.budget_max?.toString() || '',
        currency: tender.currency,
        contact_phone: tender.contact_phone || '',
        author_name: tender.author_name,
        status: tender.status,
        admin_comment: tender.admin_comment || '',
      });
    } catch (error) {
      console.error('Ошибка загрузки тендера:', error);
      toast.error('Ошибка загрузки данных тендера');
      navigate('/admin/tenders');
    } finally {
      setIsLoading(false);
    }
  };

  // Список городов Казахстана
  const cities = [
    'Алматы', 'Нур-Султан', 'Шымкент', 'Караганда', 'Актобе',
    'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау',
  ];

  // Доступные валюты
  const currencies = [
    { value: 'KZT', label: 'KZT', symbol: '₸' },
    { value: 'USD', label: 'USD', symbol: '$' },
    { value: 'RUB', label: 'RUB', symbol: '₽' },
  ];

  // Доступные статусы тендера
  const statuses = [
    { value: 'PENDING', label: 'На модерации' },
    { value: 'APPROVED', label: 'Одобрен' },
    { value: 'REJECTED', label: 'Отклонен' },
  ];

  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'categories' && type === 'checkbox') {
      // Обрабатываем множественный выбор категорий через checkbox
      const categoryId = Number(value);
      const isChecked = (e.target as HTMLInputElement).checked;

      setFormData({
        ...formData,
        categories: isChecked
          ? [...formData.categories, categoryId] // Добавляем если выбран
          : formData.categories.filter(id => id !== categoryId) // Удаляем если снят
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация обязательных полей
    if (!formData.title.trim()) {
      toast.error('Заполните название тендера');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Заполните описание тендера');
      return;
    }

    if (!formData.author_name.trim()) {
      toast.error('Заполните имя автора тендера');
      return;
    }

    setIsSubmitting(true);

    try {
      // Подготавливаем данные тендера для отправки на сервер
      const tenderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categories: formData.categories.length > 0 ? formData.categories : [],
        city: formData.city,
        deadline_date: formData.deadline_date || undefined,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        currency: formData.currency,
        contact_phone: formData.contact_phone.trim() || undefined, // Контактный телефон
        author_name: formData.author_name.trim(),
        status: formData.status,
        admin_comment: formData.admin_comment.trim() || undefined,
      };

      console.log(`${isEditMode ? 'Редактирование' : 'Создание'} тендера через админ API:`, tenderData);

      let result;
      if (isEditMode) {
        // Обновляем существующий тендер
        result = await apiService.put(`/admin/tenders/${id}/`, tenderData);
        toast.success('Тендер успешно обновлен');
      } else {
        // Создаем новый тендер
        result = await apiService.post('/admin/tenders/', tenderData);
        toast.success('Тендер успешно создан');
      }

      console.log('Тендер успешно сохранен:', result);

      // Возвращаемся к списку тендеров
      navigate('/admin/tenders');
    } catch (error: any) {
      console.error('Ошибка сохранения тендера:', error);

      // Обрабатываем различные типы ошибок от сервера
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          `Ошибка при ${isEditMode ? 'обновлении' : 'создании'} тендера`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Отображение индикатора загрузки при загрузке данных для редактирования
  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/tenders')}
            className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditMode ? 'Редактировать тендер' : 'Создать тендер'}
            </h1>
            <p className="text-dark-300">
              {isEditMode
                ? 'Редактирование существующего тендера через админ-панель'
                : 'Создание нового тендера через админ-панель'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Форма */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Название тендера */}
            <div className="lg:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-dark-200 mb-2">
                Название тендера <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                className="input"
                placeholder="Например: Требуется поставка сантехники для офиса"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Автор тендера */}
            <div>
              <label htmlFor="author_name" className="block text-sm font-medium text-dark-200 mb-2">
                Автор тендера <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="author_name"
                id="author_name"
                className="input"
                placeholder="Имя автора тендера"
                value={formData.author_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Статус тендера */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-dark-200 mb-2">
                Статус тендера
              </label>
              <select
                name="status"
                id="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              className="input"
              placeholder="Подробно опишите требования к товару или услуге"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Контактный телефон */}
          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium text-dark-200 mb-2">
              Контактный телефон
            </label>
            <input
              type="tel"
              name="contact_phone"
              id="contact_phone"
              className="input"
              placeholder="Например: +7 777 123 45 67"
              value={formData.contact_phone}
              onChange={handleChange}
            />
            <p className="text-dark-400 text-xs mt-1">
              Этот номер телефона будет виден заинтересованным поставщикам для связи с автором тендера
            </p>
          </div>

          {/* Категории */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Категории
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {isLoadingCategories ? (
                <p className="text-dark-400 col-span-full">Загрузка категорий...</p>
              ) : Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="categories"
                      value={category.id}
                      checked={formData.categories.includes(category.id)}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 mr-2"
                    />
                    <span className="text-white text-sm">{category.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-dark-400 col-span-full">Категории не найдены</p>
              )}
            </div>
          </div>

          {/* Валюта */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-dark-200 mb-2">
              Валюта <span className="text-red-500">*</span>
            </label>
            <select
              name="currency"
              id="currency"
              className="input"
              value={formData.currency}
              onChange={handleChange}
              required
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Местоположение и дедлайн */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-dark-200 mb-2">
                Город поставки
              </label>
              <select
                name="city"
                id="city"
                className="input"
                value={formData.city}
                onChange={handleChange}
              >
                <option value="">Выберите город</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deadline_date" className="block text-sm font-medium text-dark-200 mb-2">
                Срок поставки
              </label>
              <input
                type="date"
                name="deadline_date"
                id="deadline_date"
                className="input"
                value={formData.deadline_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Бюджет */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Бюджет ({currencies.find(c => c.value === formData.currency)?.symbol || '₸'})
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="budget_min"
                placeholder="От (любая сумма)"
                className="input"
                min="0"
                step="0.01"
                value={formData.budget_min}
                onChange={handleChange}
              />
              <input
                type="number"
                name="budget_max"
                placeholder="До (любая сумма)"
                className="input"
                min="0"
                step="0.01"
                value={formData.budget_max}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Комментарий администратора */}
          <div>
            <label htmlFor="admin_comment" className="block text-sm font-medium text-dark-200 mb-2">
              Комментарий администратора
            </label>
            <textarea
              name="admin_comment"
              id="admin_comment"
              rows={3}
              className="input"
              placeholder="Комментарий или пояснение от администратора..."
              value={formData.admin_comment}
              onChange={handleChange}
            />
            <p className="text-dark-400 text-xs mt-1">
              Этот комментарий будет виден всем пользователям на странице тендера
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/tenders')}
              className="px-6 py-3 border border-dark-600 text-dark-300 rounded-lg hover:bg-dark-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditMode ? 'Сохранение...' : 'Создание...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? 'Сохранить изменения' : 'Создать тендер'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Информационная карточка */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Package className="w-5 h-5 mr-2 text-primary-400" />
          Особенности админ-панели
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark-300">
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">1</div>
              <span>Админы могут создавать тендеры от имени других пользователей</span>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">2</div>
              <span>Возможность сразу устанавливать статус тендера</span>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">3</div>
              <span>Добавление комментария администратора</span>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">4</div>
              <span>Указание контактного телефона для связи</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateEditTender;