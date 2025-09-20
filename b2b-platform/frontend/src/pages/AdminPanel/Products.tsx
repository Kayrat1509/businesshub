import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Search, Edit, Trash2, Eye, Filter, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import ImageUploader from '../../components/ImageUploader';

// Интерфейсы
interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface ProductImage {
  id: number;
  image: string;
  product: number;
}

interface Product {
  id: number;
  title: string;
  sku?: string;
  description: string;
  price?: number;
  currency: string;
  is_service: boolean;
  category?: {
    id: number;
    name: string;
  };
  images: ProductImage[];
  in_stock: boolean;
  is_active: boolean;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFormData {
  title: string;
  sku: string;
  description: string;
  price: string;
  currency: string;
  is_service: boolean;
  category: number | '';
  in_stock: boolean;
  is_active: boolean;
  images: ImageFile[];
}

const AdminProducts = () => {
  // Состояния для данных
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Состояния для поиска и фильтров
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Состояния для модального окна
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Состояние формы
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    sku: '',
    description: '',
    price: '',
    currency: 'KZT',
    is_service: false,
    category: '',
    in_stock: true,
    is_active: true,
    images: [],
  });

  // Загрузка данных при инициализации
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Загрузка товаров
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.get<{ results: Product[] }>('/admin/products/');
      setProducts(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      toast.error('Ошибка загрузки товаров');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка категорий
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const data = await apiService.get<{ results: Category[] }>('/categories/');
      setCategories(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Открытие модального окна для создания
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      sku: '',
      description: '',
      price: '',
      currency: 'KZT',
      is_service: false,
      category: '',
      in_stock: true,
      is_active: true,
      images: [],
    });
    setShowModal(true);
  };

  // Открытие модального окна для редактирования
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      sku: product.sku || '',
      description: product.description,
      price: product.price?.toString() || '',
      currency: product.currency,
      is_service: product.is_service,
      category: product.category?.id || '',
      in_stock: product.in_stock,
      is_active: product.is_active,
      images: [], // Существующие изображения загружаются отдельно
    });
    setShowModal(true);
  };

  // Закрытие модального окна
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      title: '',
      sku: '',
      description: '',
      price: '',
      currency: 'KZT',
      is_service: false,
      category: '',
      in_stock: true,
      is_active: true,
      images: [],
    });
  };

  // Обработка изменений в форме
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Добавляем основные данные
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

      // Добавляем новые изображения
      formData.images.forEach((image) => {
        formDataToSend.append('images', image.file);
      });

      const url = editingProduct
        ? `/admin/products/${editingProduct.id}/`
        : '/admin/products/';

      const method = editingProduct ? 'patch' : 'post';

      await apiService[method](url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(editingProduct ? 'Товар обновлен' : 'Товар создан');
      closeModal();
      loadProducts();
    } catch (error: any) {
      console.error('Ошибка сохранения товара:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при сохранении товара';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Удаление товара
  const handleDelete = async (productId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      await apiService.delete(`/admin/products/${productId}/`);
      toast.success('Товар удален');
      loadProducts();
    } catch (error: any) {
      console.error('Ошибка удаления товара:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при удалении товара';
      toast.error(errorMessage);
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === '' || product.category?.id === selectedCategory;

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Управление товарами</h1>
          <p className="text-dark-300">Создание, редактирование и модерация товаров</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить товар</span>
        </button>
      </div>

      {/* Фильтры */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Категория */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
            className="input"
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Статус */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="input"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className="card p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left pb-3 text-dark-300 font-medium">Товар</th>
                  <th className="text-left pb-3 text-dark-300 font-medium">Категория</th>
                  <th className="text-left pb-3 text-dark-300 font-medium">Цена</th>
                  <th className="text-left pb-3 text-dark-300 font-medium">Статус</th>
                  <th className="text-left pb-3 text-dark-300 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-dark-800">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        {product.images.length > 0 && (
                          <img
                            src={product.images[0].image}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{product.title}</p>
                          <p className="text-dark-400 text-sm">
                            {product.description.slice(0, 50)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-dark-700 text-dark-300 text-sm rounded">
                        {product.category?.name || 'Без категории'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-white">
                        {product.price
                          ? `${product.price.toLocaleString()} ${product.currency}`
                          : 'Договорная'
                        }
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <p className="text-dark-300">Товары не найдены</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-900 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Заголовок модального окна */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingProduct ? 'Редактировать товар' : 'Создать товар'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Форма */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Тип товара */}
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Тип предложения
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_service"
                        checked={!formData.is_service}
                        onChange={() => setFormData(prev => ({...prev, is_service: false}))}
                        className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-white">Товар</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_service"
                        checked={formData.is_service}
                        onChange={() => setFormData(prev => ({...prev, is_service: true}))}
                        className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-white">Услуга</span>
                    </label>
                  </div>
                </div>

                {/* Название */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-dark-200 mb-2">
                    Название
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={formData.title}
                    onChange={handleFormChange}
                    className="input"
                  />
                </div>

                {/* SKU и категория */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-dark-200 mb-2">
                      Артикул/SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      id="sku"
                      value={formData.sku}
                      onChange={handleFormChange}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-dark-200 mb-2">
                      Категория
                    </label>
                    <select
                      name="category"
                      id="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="input"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Описание */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleFormChange}
                    className="input"
                  />
                </div>

                {/* Изображения */}
                <ImageUploader
                  value={formData.images}
                  onChange={(images) => setFormData(prev => ({...prev, images}))}
                  maxImages={5}
                  disabled={isSubmitting}
                />

                {/* Цена */}
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
                        value={formData.price}
                        onChange={handleFormChange}
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="w-32">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleFormChange}
                        className="input"
                      >
                        <option value="KZT">₸ KZT</option>
                        <option value="RUB">₽ RUB</option>
                        <option value="USD">$ USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Настройки */}
                <div className="space-y-3">
                  {!formData.is_service && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="in_stock"
                        checked={formData.in_stock}
                        onChange={handleFormChange}
                        className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-white">В наличии</span>
                    </label>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                      className="w-4 h-4 text-primary-600 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-white">Активен</span>
                  </label>
                </div>

                {/* Кнопки */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-dark-600 text-dark-300 rounded-lg hover:bg-dark-800 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 btn-primary disabled:opacity-50"
                  >
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;