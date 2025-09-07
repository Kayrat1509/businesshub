import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Package, Save, ArrowLeft } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api'; // Для загрузки категорий
import { tenderService } from '../../services/tenderService'; // Новый сервис для создания тендеров
import { fetchMyTenders } from '../../store/slices/tendersSlice'; // Для обновления списка после создания
import { Category } from '../../types';

// Интерфейс формы создания тендера - соответствует полям backend модели Tender
interface TenderForm {
  title: string // Название тендера (обязательное поле)
  description: string // Подробное описание требований (обязательное поле)
  categories: number[] // Массив ID категорий (обязательное поле)
  city: string // Город поставки (опциональное поле)
  deadline_date: string // Крайний срок в формате YYYY-MM-DD (опциональное поле)
  budget_min: string // Минимальный бюджет - снято ограничение на количество цифр (опциональное поле)
  budget_max: string // Максимальный бюджет - снято ограничение на количество цифр (опциональное поле)
  // Поля author и company НЕ включены - назначаются автоматически на backend
}

const CreateTender = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // Для обновления Redux state после создания тендера
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });

  // Загрузка категорий при инициализации компонента
  useEffect(() => {
    loadCategories();
  }, []);

  // Функция загрузки категорий через единый API слой
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      // Загружаем категории через единый API слой с автоматическим управлением токенами
      const data = await apiService.get<{ results: Category[] }>('/categories/');
      
      // API возвращает пагинированный ответ, категории находятся в поле results
      if (data && Array.isArray(data.results)) {
        setCategories(data.results); // Сохраняем только массив категорий
      } else {
        console.error('Получены некорректные данные категорий:', data);
        setCategories([]); // Устанавливаем пустой массив если данные некорректны
        toast.error('Получены некорректные данные категорий');
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setCategories([]); // Устанавливаем пустой массив при ошибке
      toast.error('Ошибка загрузки категорий');
    } finally {
      setIsLoadingCategories(false); // Всегда сбрасываем флаг загрузки
    }
  };

  const cities = [
    'Алматы', 'Нур-Султан', 'Шымкент', 'Караганда', 'Актобе', 
    'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау',
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || formData.categories.length === 0) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Подготавливаем данные тендера для отправки на сервер
      const tenderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categories: formData.categories, // Массив ID выбранных категорий
        city: formData.city,
        deadline_date: formData.deadline_date || undefined,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
      };
      
      console.log('Создание тендера через новый tenderService:', tenderData);
      
      // Используем новый tenderService для создания тендера
      // Автоматически обрабатывается авторизация, обновление токенов и назначение компании
      const createdTender = await tenderService.createTender(tenderData);
      
      console.log('Тендер успешно создан:', createdTender);
      toast.success('Тендер успешно создан и отправлен на модерацию');
      
      // Обновляем список тендеров пользователя в Redux store
      dispatch(fetchMyTenders({ page: 1 }));
      
      navigate('/dashboard'); // Перенаправляем в дашборд после успешного создания
    } catch (error: any) {
      console.error('Ошибка создания тендера:', error);
      
      // Обрабатываем различные типы ошибок от сервера
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          'Ошибка при создании тендера';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false); // Всегда сбрасываем флаг загрузки
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Создать тендер</h1>
            <p className="text-dark-300">Опишите товары или услуги, которые вам нужны</p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-dark-200 mb-2">
              Название тендера *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="input"
              placeholder="Например: Требуется поставка сантехники для офиса"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Категории *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {isLoadingCategories ? (
                <p className="text-dark-400 col-span-full">Загрузка категорий...</p>
              ) : Array.isArray(categories) && categories.length > 0 ? (
                // Рендерим категории только если они представляют собой массив с элементами
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
                // Показываем сообщение если категории не загрузились
                <p className="text-dark-400 col-span-full">Категории не найдены</p>
              )}
            </div>
          </div>


          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
              Описание *
            </label>
            <textarea
              name="description"
              id="description"
              required
              rows={4}
              className="input"
              placeholder="Подробно опишите ваши требования к товару или услуге"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Location and Deadline */}
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

          {/* Budget - снято ограничение на количество цифр */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Бюджет (₸) - любая сумма
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


          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
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
                  <span>Создание...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Создать тендер</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Package className="w-5 h-5 mr-2 text-primary-400" />
          Как работают тендеры
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark-300">
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">1</div>
              <span>Создайте тендер с подробным описанием</span>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">2</div>
              <span>Тендер пройдет модерацию и будет опубликован</span>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">3</div>
              <span>Поставщики будут отправлять вам предложения</span>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">4</div>
              <span>Выберите лучшее предложение</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateTender;