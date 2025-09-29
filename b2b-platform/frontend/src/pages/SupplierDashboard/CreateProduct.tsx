import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Save, ArrowLeft, Upload, DollarSign, Tag } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import { Category } from '../../types';
import CategorySelector from '../../components/CategorySelector';
// import ImageUploader from '../../components/ImageUploader';

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
  image: File | null
  company_id: number | ''
}

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

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
    image: null,
    company_id: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Загрузка категорий и компаний пользователя при инициализации компонента
  useEffect(() => {
    loadCategories();
    loadUserCompanies();
  }, []);

  const loadUserCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      // Получаем компании пользователя
      const companies = await apiService.get<any>('/companies/?owner=me');
      if (companies && companies.results && companies.results.length > 0) {
        setUserCompanies(companies.results);
        // Автоматически выбираем первую компанию если она единственная
        if (companies.results.length === 1) {
          setFormData(prev => ({
            ...prev,
            company_id: companies.results[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки компаний пользователя:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      // Загружаем иерархическое дерево только активных категорий
      const data = await apiService.get<Category[]>('/categories/tree/');

      if (data && Array.isArray(data)) {
        const processedCategories = data.map(cat => ({
          ...cat,
          children: Array.isArray(cat.children) ? cat.children : []
        }));
        setCategories(processedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setCategories([]);
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
    } else if (name === 'category' || name === 'company_id') {
      // Конвертируем значение в число для категории и company_id
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

  // Обработчик выбора категории для нового компонента
  const handleCategorySelect = (categoryId: number) => {
    setFormData({
      ...formData,
      category: categoryId,
    });
  };


  // Fallback на простой select если категории не загрузились или произошла ошибка
  const renderCategorySelector = () => {
    if (isLoadingCategories) {
      return (
        <select className="input disabled:opacity-50" disabled>
          <option>Загрузка категорий...</option>
        </select>
      );
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return (
        <select
          name="category"
          id="category"
          className="input"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="">Категории не загружены</option>
        </select>
      );
    }

    return (
      <CategorySelector
        categories={categories}
        selectedCategoryId={typeof formData.category === 'number' ? formData.category : null}
        onSelect={handleCategorySelect}
        disabled={isLoadingCategories}
        placeholder="Выберите категорию"
      />
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Проверяем тип файла
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Разрешены только форматы JPG, PNG и WebP');
        return;
      }

      // Проверяем размер файла (например, максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Размер файла не должен превышать 5MB');
        return;
      }

      setFormData({
        ...formData,
        image: file,
      });

      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        image: null,
      });
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем что компания выбрана
    if (!formData.company_id) {
      toast.error('Пожалуйста, выберите компанию');
      return;
    }

    setIsSubmitting(true);

    try {
      // Создаем FormData для отправки файла
      const formDataToSend = new FormData();

      // Добавляем основные данные товара
      formDataToSend.append('title', formData.title.trim() || 'Без названия');
      if (formData.sku.trim()) {
        formDataToSend.append('sku', formData.sku.trim());
      }
      formDataToSend.append('description', formData.description.trim() || 'Описание отсутствует');
      if (formData.price) {
        formDataToSend.append('price', formData.price);
      }
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('is_service', formData.is_service.toString());
      if (formData.category) {
        formDataToSend.append('category', formData.category.toString());
      }
      formDataToSend.append('in_stock', formData.in_stock.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      // Добавляем изображение
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Добавляем ID выбранной компании
      if (formData.company_id) {
        formDataToSend.append('company_id', formData.company_id.toString());
      }

      // Отправляем запрос на стандартный endpoint
      const createdProduct = await apiService.post('/products/', formDataToSend);

      console.log('Продукт создан:', createdProduct);
      toast.success('Продукт успешно добавлен');
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
                  id="type-product"
                  name="is_service"
                  value="false"
                  checked={!formData.is_service}
                  onChange={() => setFormData({...formData, is_service: false})}
                  className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-white">Продукт</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  id="type-service"
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

          {/* Company Selection */}
          <div>
            <label htmlFor="company_id" className="block text-sm font-medium text-dark-200 mb-2">
              Компания *
            </label>
            <select
              name="company_id"
              id="company_id"
              disabled={isLoadingCompanies}
              className="input disabled:opacity-50"
              value={formData.company_id}
              onChange={handleChange}
              required
            >
              <option value="">
                {isLoadingCompanies ? 'Загрузка компаний...' : 'Выберите компанию'}
              </option>
              {userCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.supplier_type || 'Тип не указан'})
                </option>
              ))}
            </select>
            {userCompanies.length === 0 && !isLoadingCompanies && (
              <p className="text-sm text-red-400 mt-1">
                У вас нет зарегистрированных компаний. Сначала добавьте компанию.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-dark-200 mb-2">
              Название {formData.is_service ? 'услуги' : 'товара'}
            </label>
            <input
              type="text"
              name="title"
              id="title"
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
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Категория
              </label>
              {renderCategorySelector()}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
              Описание
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              className="input"
              placeholder={formData.is_service ? 'Подробно опишите услугу, процесс выполнения, сроки' : 'Подробно опишите товар, его характеристики, материалы'}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-dark-200 mb-2">
              Фото товара
            </label>
            <div className="space-y-4">
              <input
                type="file"
                name="image"
                id="image"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="block w-full text-sm text-dark-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary-600 file:text-white
                  hover:file:bg-primary-700
                  file:disabled:opacity-50
                  file:disabled:cursor-not-allowed"
              />

              {imagePreview && (
                <div className="relative w-32 h-32">
                  <img
                    src={imagePreview}
                    alt="Превью изображения"
                    className="w-full h-full object-cover rounded-lg border border-dark-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({...formData, image: null});
                      setImagePreview(null);
                      // Сброс input file
                      const fileInput = document.getElementById('image') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full
                      flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}

              <p className="text-xs text-dark-400">
                Разрешены форматы: JPG, PNG, WebP. Максимальный размер: 5MB.
                Изображение будет автоматически обрезано до 600x600 пикселей.
              </p>
            </div>
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
                  id="price"
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
                  id="in_stock"
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
                id="is_active"
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