import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import {
  Package, Save, Edit3, Plus, Trash2, Search, Filter,
  DollarSign, Tag, CheckCircle, XCircle, Loader, Eye,
  Image as ImageIcon, AlertCircle, X,
} from 'lucide-react';
import apiService from '../../api';

interface Product {
  id?: number
  title: string
  sku?: string
  description: string
  price?: number
  currency: string
  is_service: boolean
  category?: Category | number
  images: string[]
  in_stock: boolean
  is_active: boolean
  company_name?: string
  primary_image?: string
  created_at?: string
  updated_at?: string
}

interface Category {
  id: number
  name: string
  slug?: string
}

const DashboardProducts: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterService, setFilterService] = useState<boolean | ''>('');

  const [formData, setFormData] = useState<Product>({
    title: '',
    sku: '',
    description: '',
    price: undefined,
    currency: 'RUB',
    is_service: false,
    category: undefined,
    images: [],
    in_stock: true,
    is_active: true,
  });

  const currencies = [
    { value: 'RUB', label: '₽ Рубли' },
    { value: 'USD', label: '$ Доллары' },
    { value: 'EUR', label: '€ Евро' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      const mockProducts: Product[] = [
        {
          id: 1,
          title: 'Смеситель для кухни',
          sku: 'SME-001',
          description: 'Качественный смеситель из нержавеющей стали с поворотным изливом',
          price: 15000,
          currency: 'RUB',
          is_service: false,
          category: 1,
          images: [],
          in_stock: true,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          title: 'Кабель ВВГ 3x2.5',
          sku: 'KAB-002',
          description: 'Медный кабель для электропроводки, длина 100м',
          price: 2500,
          currency: 'RUB',
          is_service: false,
          category: 2,
          images: [],
          in_stock: true,
          is_active: true,
          created_at: '2024-01-14T15:00:00Z',
        },
        {
          id: 3,
          title: 'Монтаж сантехники',
          sku: 'SER-001',
          description: 'Профессиональный монтаж сантехнического оборудования',
          price: 5000,
          currency: 'RUB',
          is_service: true,
          category: 1,
          images: [],
          in_stock: true,
          is_active: true,
          created_at: '2024-01-13T12:00:00Z',
        },
      ];

      const mockCategories: Category[] = [
        { id: 1, name: 'Сантехника' },
        { id: 2, name: 'Электрика' },
        { id: 3, name: 'Лакокрасочные материалы' },
        { id: 4, name: 'Кровельные материалы' },
        { id: 5, name: 'Железобетонные изделия' },
      ];
      
      setProducts(mockProducts);
      setCategories(mockCategories);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Введите название товара');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Введите описание товара');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prepare data for save
      const dataToSave = {
        ...formData,
        category: typeof formData.category === 'object' && formData.category ? formData.category.id : formData.category,
        price: formData.price || null,
        created_at: new Date().toISOString(),
      };
      
      let savedProduct: Product;
      if (editingProduct?.id) {
        // Update existing product
        savedProduct = { ...dataToSave, id: editingProduct.id };
        toast.success('Товар обновлен');
        
        // Update products list
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? savedProduct : p));
      } else {
        // Create new product
        savedProduct = { ...dataToSave, id: Date.now() };
        toast.success('Товар создан');
        
        // Add to products list
        setProducts(prev => [savedProduct, ...prev]);
      }
      
      // Reset form
      resetForm();
      
    } catch (error: any) {
      let errorMessage = 'Ошибка сохранения товара';
      
      if (error?.response?.status === 403) {
        errorMessage = 'У вас нет прав для редактирования этого товара';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Товар не найден';
      } else if (error?.response?.status === 400) {
        errorMessage = 'У вас должна быть одобренная компания для создания товаров';
      } else {
        errorMessage = error?.response?.data?.message || 
                      error?.response?.data?.detail ||
                      Object.values(error?.response?.data || {}).flat().join('; ') ||
                      'Ошибка сохранения товара';
      }
      
      toast.error(errorMessage);
      console.error('Save error:', error);
      console.error('Error response:', error?.response?.data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!product.id) {
return;
}
    
    if (!confirm(`Вы уверены, что хотите удалить товар "${product.title}"?`)) {
      return;
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Товар удален');
    } catch (error: any) {
      toast.error('Ошибка удаления товара');
      console.error('Delete error:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      price: product.price || undefined,
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      sku: '',
      description: '',
      price: undefined,
      currency: 'RUB',
      is_service: false,
      category: undefined,
      images: [],
      in_stock: true,
      is_active: true,
    });
    setEditingProduct(null);
    setShowCreateForm(false);
  };

  const getCategoryName = (categoryId: number | undefined) => {
    if (!categoryId) {
return 'Без категории';
}
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Без категории';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || 
                           (typeof product.category === 'object' ? product.category?.id === filterCategory : product.category === filterCategory);
    
    const matchesService = filterService === '' || product.is_service === filterService;
    
    return matchesSearch && matchesCategory && matchesService;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Мои товары</h1>
          <p className="text-dark-300">
            Управляйте товарами и услугами вашей компании
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить товар</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : '')}
            className="input"
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={filterService.toString()}
            onChange={(e) => setFilterService(e.target.value === '' ? '' : e.target.value === 'true')}
            className="input"
          >
            <option value="">Товары и услуги</option>
            <option value="false">Только товары</option>
            <option value="true">Только услуги</option>
          </select>
          
          <div className="flex items-center text-sm text-dark-300">
            <Package className="w-4 h-4 mr-2" />
            {filteredProducts.length} из {products.length}
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
            </h2>
            <button
              onClick={resetForm}
              className="text-dark-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Название товара *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="input"
                placeholder="Введите название товара"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Артикул
              </label>
              <input
                type="text"
                value={formData.sku || ''}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                className="input"
                placeholder="ART-001"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Описание *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input resize-none"
                rows={4}
                placeholder="Подробное описание товара или услуги"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Цена
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value ? Number(e.target.value) : undefined)}
                  className="input flex-1"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="input w-24"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Категория
              </label>
              <select
                value={typeof formData.category === 'object' && formData.category ? formData.category.id : formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value ? Number(e.target.value) : undefined)}
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
            
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_service}
                    onChange={(e) => handleInputChange('is_service', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-dark-200">Это услуга</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => handleInputChange('in_stock', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-dark-200">В наличии</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-dark-200">Активный</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <button
              onClick={resetForm}
              className="btn-outline"
              disabled={isSaving}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center space-x-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      )}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-dark-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {products.length === 0 ? 'У вас пока нет товаров' : 'Товары не найдены'}
          </h2>
          <p className="text-dark-300 mb-6">
            {products.length === 0 
              ? 'Добавьте свой первый товар или услугу, чтобы начать продавать'
              : 'Попробуйте изменить параметры поиска'
            }
          </p>
          {products.length === 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить товар</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  {product.is_service ? (
                    <Tag className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Package className="w-5 h-5 text-green-400" />
                  )}
                  <span className="text-sm text-dark-300">
                    {product.is_service ? 'Услуга' : 'Товар'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {product.in_stock ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm ${product.in_stock ? 'text-green-400' : 'text-red-400'}`}>
                    {product.in_stock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 truncate">
                {product.title}
              </h3>
              
              {product.sku && (
                <p className="text-sm text-dark-400 mb-2">
                  Артикул: {product.sku}
                </p>
              )}

              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs px-2 py-1 bg-primary-600/20 text-primary-400 rounded">
                  {getCategoryName(product.category as number)}
                </span>
              </div>
              
              <p className="text-dark-300 mb-4 text-sm line-clamp-3">
                {product.description}
              </p>
              
              {product.price && (
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">
                    {product.price.toLocaleString()} {product.currency}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-dark-400">
                  {new Date(product.created_at || '').toLocaleDateString()}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardProducts;