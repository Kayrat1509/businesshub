import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Save, ArrowLeft, Upload, DollarSign, Tag } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import { Category } from '../../types';

interface ProductForm {
  title: string
  sku: string
  description: string
  price: string
  currency: string
  is_service: boolean
  category: number | ''
  in_stock: boolean
  is_active: boolean
}

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<ProductForm>({
    title: '',
    sku: '',
    description: '',
    price: '',
    currency: 'KZT',
    is_service: false,
    category: '',
    in_stock: true,
    is_active: true,
  });

  // Загрузка категорий при инициализации компонента
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const data = await apiService.get<Category[]>('/categories/');
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      toast.error('Ошибка загрузки категорий');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === 'category') {
      // Конвертируем значение в число для категории
      setFormData({
        ...formData,
        [name]: value ? Number(value) : '',
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
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Подготавливаем данные для отправки на backend
      const productData = {
        title: formData.title.trim(),
        sku: formData.sku.trim() || undefined,
        description: formData.description.trim(),
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: formData.currency,
        is_service: formData.is_service,
        category: formData.category, // ID категории
        in_stock: formData.in_stock,
        is_active: formData.is_active,
      };
      
      console.log('Создание товара:', productData);
      
      // Отправляем запрос на backend - компания будет присвоена автоматически
      const createdProduct = await apiService.post('/products/', productData);
      
      console.log('Товар создан:', createdProduct);
      toast.success('Товар успешно добавлен');
      navigate('/dashboard/products');
    } catch (error: any) {
      console.error('Ошибка создания товара:', error);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          'Ошибка при добавлении товара';
      toast.error(errorMessage);
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
            onClick={() => navigate('/dashboard/products')}
            className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Добавить товар</h1>
            <p className="text-dark-300">Создайте новый товар или услугу в каталоге</p>
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
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">
              Тип предложения
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_service"
                  value="false"
                  checked={!formData.is_service}
                  onChange={() => setFormData({...formData, is_service: false})}
                  className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-white">Товар</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_service"
                  value="true"
                  checked={formData.is_service}
                  onChange={() => setFormData({...formData, is_service: true})}
                  className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-white">Услуга</span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-dark-200 mb-2">
              Название {formData.is_service ? 'услуги' : 'товара'} *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="input"
              placeholder={formData.is_service ? 'Например: Монтаж сантехники' : 'Например: Смеситель для кухни'}
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* SKU and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-dark-200 mb-2">
                Артикул/SKU
              </label>
              <input
                type="text"
                name="sku"
                id="sku"
                className="input"
                placeholder="Например: SME-001"
                value={formData.sku}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-dark-200 mb-2">
                Категория *
              </label>
              <select
                name="category"
                id="category"
                required
                disabled={isLoadingCategories}
                className="input disabled:opacity-50"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">
                  {isLoadingCategories ? 'Загрузка категорий...' : 'Выберите категорию'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
              placeholder={formData.is_service ? 'Подробно опишите услугу, процесс выполнения, сроки' : 'Подробно опишите товар, его характеристики, материалы'}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Цена
            </label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
              <div className="w-32">
                <select
                  name="currency"
                  className="input"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="KZT">₸ KZT</option>
                  <option value="RUB">₽ RUB</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-dark-400 mt-1">
              Оставьте пустым, если цена "по запросу"
            </p>
          </div>

          {/* Stock Status */}
          {!formData.is_service && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="in_stock"
                  checked={formData.in_stock}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-white">В наличии</span>
              </label>
            </div>
          )}

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-white">Активен (отображается в каталоге)</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
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
                  <span>Добавление...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Добавить {formData.is_service ? 'услугу' : 'товар'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Package className="w-5 h-5 mr-2 text-primary-400" />
          Советы для лучшего описания
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark-300">
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Используйте понятные названия
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Укажите основные характеристики
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Добавьте качественные фото
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Правильно выберите категорию
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateProduct;