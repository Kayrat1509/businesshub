import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Package, Save, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api';

interface TenderForm {
  title: string
  description: string
  category: string
  quantity: string
  unit: string
  delivery_city: string
  delivery_deadline: string
  budget_min: string
  budget_max: string
  requirements: string
}

const CreateTender = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories] = useState([
    'Сантехника',
    'Электрика',
    'Лакокрасочные материалы',
    'Кровельные материалы',
    'Железобетонные изделия',
  ]);

  const [formData, setFormData] = useState<TenderForm>({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    delivery_city: '',
    delivery_deadline: '',
    budget_min: '',
    budget_max: '',
    requirements: '',
  });

  const units = [
    'шт', 'кг', 'г', 'т', 'л', 'м', 'м²', 'м³', 'компл', 'упак', 'рул', 'пач',
  ];

  const cities = [
    'Алматы', 'Нур-Султан', 'Шымкент', 'Караганда', 'Актобе', 
    'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const tenderData = {
        ...formData,
        author: user?.id,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      
      console.log('Creating tender:', tenderData);
      
      toast.success('Тендер успешно создан и отправлен на модерацию');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Ошибка при создании тендера');
      console.error('Create tender error:', error);
    } finally {
      setIsSubmitting(false);
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

          {/* Category and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-dark-200 mb-2">
                Категория *
              </label>
              <select
                name="category"
                id="category"
                required
                className="input"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-dark-200 mb-2">
                Единица измерения
              </label>
              <select
                name="unit"
                id="unit"
                className="input"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="">Выберите единицу</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-dark-200 mb-2">
              Количество
            </label>
            <input
              type="text"
              name="quantity"
              id="quantity"
              className="input"
              placeholder="Например: 50"
              value={formData.quantity}
              onChange={handleChange}
            />
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
              <label htmlFor="delivery_city" className="block text-sm font-medium text-dark-200 mb-2">
                Город поставки
              </label>
              <select
                name="delivery_city"
                id="delivery_city"
                className="input"
                value={formData.delivery_city}
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
              <label htmlFor="delivery_deadline" className="block text-sm font-medium text-dark-200 mb-2">
                Срок поставки
              </label>
              <input
                type="date"
                name="delivery_deadline"
                id="delivery_deadline"
                className="input"
                value={formData.delivery_deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Бюджет (₸)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="budget_min"
                placeholder="От"
                className="input"
                value={formData.budget_min}
                onChange={handleChange}
              />
              <input
                type="number"
                name="budget_max"
                placeholder="До"
                className="input"
                value={formData.budget_max}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-dark-200 mb-2">
              Дополнительные требования
            </label>
            <textarea
              name="requirements"
              id="requirements"
              rows={3}
              className="input"
              placeholder="Сертификаты качества, опыт работы, гарантии и т.д."
              value={formData.requirements}
              onChange={handleChange}
            />
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