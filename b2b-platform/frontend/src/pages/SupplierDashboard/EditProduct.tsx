import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Save, ArrowLeft, Upload, DollarSign, Tag } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import { Category } from '../../types';
import CategorySelector from '../../components/CategorySelector';
import LoadingSpinner from '../../components/LoadingSpinner';

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

interface Product {
  id: number
  title: string
  sku: string
  description: string
  price?: number
  currency: string
  is_service: boolean
  category?: {
    id: number
    name: string
  }
  in_stock: boolean
  is_active: boolean
  image?: string
  company: {
    id: number
    name: string
  }
}

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

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

  // Загрузка данных товара
  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  // Загрузка пользовательских компаний
  useEffect(() => {
    loadUserCompanies();
  }, []);

  // Загрузка категорий
  useEffect(() => {
    loadCategories();
  }, []);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const productData = await apiService.get<Product>(`/products/${id}/`);
      setProduct(productData);

      // Заполняем форму данными товара
      setFormData({
        title: productData.title || '',
        sku: productData.sku || '',
        description: productData.description || '',
        price: productData.price ? productData.price.toString() : '',
        currency: productData.currency || 'KZT',
        is_service: productData.is_service || false,
        category: productData.category?.id || '',
        in_stock: productData.in_stock || true,
        is_active: productData.is_active || true,
        image: null,
        company_id: productData.company?.id || '',
      });

      // Устанавливаем превью существующего изображения
      if (productData.image) {
        setImagePreview(productData.image);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки товара:', error);
      if (error?.response?.status === 404) {
        toast.error('Товар не найден');
        navigate('/dashboard');
      } else {
        toast.error('Ошибка загрузки товара');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserCompanies = async () => {
    try {
      const companies = await apiService.get<any>('/companies/?owner=me');
      if (companies && companies.results && companies.results.length > 0) {
        setUserCompanies(companies.results);
      }
    } catch (error) {
      console.error('Ошибка загрузки компаний:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.get<Category[]>('/categories/');
      setCategories(categoriesData);
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
    } else if (name === 'category' || name === 'company_id') {
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

  const handleCategorySelect = (categoryId: number) => {
    setFormData({
      ...formData,
      category: categoryId,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
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
      // Возвращаем к исходному изображению товара
      setImagePreview(product?.image || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_id) {
      toast.error('Пожалуйста, выберите компанию');
      return;
    }

    setIsSubmitting(true);

    try {
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

      // Добавляем изображение только если оно было изменено
      if (formData.image) {
        formDataToSend.append('image', formData.image);
        console.log('Обновление товара с новым изображением:', formData.image.name);
      }

      // Добавляем ID выбранной компании
      if (formData.company_id) {
        formDataToSend.append('company_id', formData.company_id.toString());
      }

      // Отправляем PATCH запрос для обновления товара
      const updatedProduct = await apiService.patch(`/products/${id}/`, formDataToSend);

      console.log('Товар обновлен:', updatedProduct);
      toast.success('Товар успешно обновлен');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Ошибка обновления товара:', error);

      let errorMessage = 'Ошибка при обновлении товара';

      if (error?.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Товар не найден</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary px-6 py-3"
          >
            Вернуться в кабинет
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад в кабинет</span>
            </button>
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="w-8 h-8 text-secondary-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Редактировать товар</h1>
              <p className="text-dark-300">Обновите информацию о товаре</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Выбор компании */}
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
                  {isLoadingCompanies ? 'Загрузка...' : 'Выберите компанию'}
                </option>
                {userCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Тип предложения */}
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
                  <span className="ml-2 text-white">Товар</span>
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

            {/* Название товара */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-dark-200 mb-2">
                Название {formData.is_service ? 'услуги' : 'товара'} *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder={`Введите название ${formData.is_service ? 'услуги' : 'товара'}`}
                required
              />
            </div>

            {/* SKU (только для товаров) */}
            {!formData.is_service && (
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-dark-200 mb-2">
                  Артикул/SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="input"
                  placeholder="Введите артикул товара"
                />
              </div>
            )}

            {/* Описание */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
                Описание *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="input"
                placeholder={`Подробное описание ${formData.is_service ? 'услуги' : 'товара'}`}
                required
              />
            </div>

            {/* Цена и валюта */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-dark-200 mb-2">
                  Цена
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-dark-400 mt-1">Оставьте пустым для "Цена по запросу"</p>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-dark-200 mb-2">
                  Валюта
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="KZT">₸ Тенге</option>
                  <option value="RUB">₽ Рубль</option>
                  <option value="USD">$ Доллар</option>
                </select>
              </div>
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Категория *
              </label>
              <CategorySelector
                categories={categories}
                selectedCategoryId={formData.category as number}
                onSelect={handleCategorySelect}
                disabled={isLoadingCategories}
                placeholder={isLoadingCategories ? 'Загрузка категорий...' : 'Выберите категорию'}
              />
            </div>

            {/* Изображение */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-dark-200 mb-2">
                Изображение товара
              </label>

              {imagePreview && (
                <div className="mb-4 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Превью"
                    className="w-full h-full object-cover rounded-lg border border-dark-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({...formData, image: null});
                      setImagePreview(product?.image || null);
                      const fileInput = document.getElementById('image') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center hover:border-dark-500 transition-colors">
                <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                <div className="text-sm text-dark-300 mb-2">
                  {imagePreview ? 'Изменить изображение' : 'Загрузить изображение'}
                </div>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="btn-outline cursor-pointer inline-block"
                >
                  Выбрать файл
                </label>
                <p className="text-xs text-dark-400 mt-2">PNG, JPG до 5MB</p>
              </div>
            </div>

            {/* Статус товара */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!formData.is_service && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="in_stock"
                    name="in_stock"
                    checked={formData.in_stock}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="in_stock" className="ml-2 text-sm text-white">
                    В наличии
                  </label>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-white">
                  Активен (видим в каталоге)
                </label>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Сохранить изменения</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 btn-outline"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProduct;