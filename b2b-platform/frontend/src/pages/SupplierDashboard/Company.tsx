import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'react-hot-toast';
import {
  Building2, Save, Edit3, MapPin, Phone, Mail, Globe,
  Users, Clock, Star, AlertCircle, Upload, X, Plus,
  CheckCircle, XCircle, Loader, ArrowRight, Home,
} from 'lucide-react';
import apiService from '../../api';

interface Company {
  id?: number
  name: string
  description: string
  logo?: string
  city: string
  address: string
  contacts: {
    phone?: string
    email?: string
    website?: string
  }
  legal_info: {
    inn?: string
    kpp?: string
    ogrn?: string
    legal_address?: string
  }
  payment_methods: string[]
  work_schedule: {
    [key: string]: {
      open: string
      close: string
      is_working: boolean
    }
  }
  staff_count: number
  branches_count: number
  status: string
  rating?: number
  categories: number[] | Category[] // Can be either IDs or full objects
  created_at?: string
  updated_at?: string
}

interface Category {
  id: number
  name: string
}

const DashboardCompany: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState<Company>({
    name: '',
    description: '',
    city: '',
    address: '',
    contacts: {},
    legal_info: {},
    payment_methods: [],
    work_schedule: {
      monday: { open: '09:00', close: '18:00', is_working: true },
      tuesday: { open: '09:00', close: '18:00', is_working: true },
      wednesday: { open: '09:00', close: '18:00', is_working: true },
      thursday: { open: '09:00', close: '18:00', is_working: true },
      friday: { open: '09:00', close: '18:00', is_working: true },
      saturday: { open: '10:00', close: '16:00', is_working: false },
      sunday: { open: '10:00', close: '16:00', is_working: false },
    },
    staff_count: 1,
    branches_count: 1,
    status: 'DRAFT',
    rating: 0,
    categories: [],
  });

  const paymentMethods = [
    { value: 'CASH', label: 'Наличные' },
    { value: 'CARD', label: 'Банковские карты' },
    { value: 'TRANSFER', label: 'Банковский перевод' },
    { value: 'CRYPTO', label: 'Криптовалюта' },
  ];

  const weekDays = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
    { key: 'saturday', label: 'Суббота' },
    { key: 'sunday', label: 'Воскресенье' },
  ];

  useEffect(() => {
    console.log('Current user:', user);
    loadData();
  }, []);

  const loadData = async (preserveEditingState = false) => {
    setIsLoading(true);
    
    // Timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Loading timeout - forcing loading to false');
      setIsLoading(false);
    }, 10000); // 10 seconds timeout
    
    try {
      // Load user's companies and categories - only their own companies
      console.log('Loading company data for user:', user?.email);
      
      let companiesResponse: Company[] = [];
      try {
        companiesResponse = await apiService.get<Company[]>('/companies/my/');
        console.log('Loaded user companies:', companiesResponse);
      } catch (error) {
        console.error('Failed to load user companies:', error);
        // Don't fallback to all companies - users should only edit their own
        companiesResponse = [];
      }
      
      const categoriesResponse = await apiService.get<Category[]>('/categories/');
      
      console.log('User companies response:', companiesResponse);
      console.log('Categories response:', categoriesResponse);
      
      setCategories(categoriesResponse);
      
      // Only use companies that belong to the current user
      const companies = Array.isArray(companiesResponse) ? companiesResponse : [];
      console.log('User-owned companies:', companies);
      
      // For suppliers, find their company. Take the first one if available
      const userCompany = companies.length > 0 ? companies[0] : null;
      console.log('Selected user company:', userCompany);
      
      if (userCompany) {
        // Convert category objects to IDs if needed
        const processedCompany = {
          ...userCompany,
          categories: Array.isArray(userCompany.categories) && userCompany.categories.length > 0
            ? typeof userCompany.categories[0] === 'object' 
              ? (userCompany.categories as Category[]).map(cat => cat.id)
              : userCompany.categories as number[]
            : [],
          contacts: userCompany.contacts || {},
          legal_info: userCompany.legal_info || {},
          payment_methods: userCompany.payment_methods || [],
          work_schedule: userCompany.work_schedule || {
            monday: { open: '09:00', close: '18:00', is_working: true },
            tuesday: { open: '09:00', close: '18:00', is_working: true },
            wednesday: { open: '09:00', close: '18:00', is_working: true },
            thursday: { open: '09:00', close: '18:00', is_working: true },
            friday: { open: '09:00', close: '18:00', is_working: true },
            saturday: { open: '10:00', close: '16:00', is_working: false },
            sunday: { open: '10:00', close: '16:00', is_working: false },
          },
          rating: userCompany.rating || 0,
          staff_count: userCompany.staff_count || 1,
          branches_count: userCompany.branches_count || 1,
        };
        
        console.log('Processed company data:', processedCompany);
        setCompany(processedCompany);
        
        // Only update form data if not preserving editing state
        if (!preserveEditingState) {
          setFormData(processedCompany);
        }
      } else {
        if (!preserveEditingState) {
          setIsEditing(true); // Create mode if no company
        }
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error('Load error:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof Company],
        [field]: value,
      },
    }));
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      work_schedule: {
        ...prev.work_schedule,
        [day]: {
          ...prev.work_schedule[day],
          [field]: value,
        },
      },
    }));
  };

  const handlePaymentMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => {
      const currentCategories = Array.isArray(prev.categories) ? prev.categories as number[] : [];
      return {
        ...prev,
        categories: currentCategories.includes(categoryId)
          ? currentCategories.filter(c => c !== categoryId)
          : [...currentCategories, categoryId],
      };
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Введите название компании');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare data for API - ensure categories are numbers
      const dataToSave = {
        ...formData,
        categories: Array.isArray(formData.categories) ? formData.categories as number[] : [],
      };
      
      console.log('Saving company data:', dataToSave);
      
      let savedCompany;
      if (company?.id) {
        // Update existing company
        console.log('Updating company with ID:', company.id);
        savedCompany = await apiService.put<Company>(`/companies/${company.id}/`, dataToSave);
        console.log('Updated company response:', savedCompany);
        toast.success('Компания обновлена');
      } else {
        // Create new company
        console.log('Creating new company');
        savedCompany = await apiService.post<Company>('/companies/', dataToSave);
        console.log('Created company response:', savedCompany);
        toast.success('Компания создана');
      }
      
      // Process saved company data
      const processedSavedCompany = {
        ...savedCompany,
        categories: Array.isArray(savedCompany.categories) && savedCompany.categories.length > 0
          ? typeof savedCompany.categories[0] === 'object' 
            ? (savedCompany.categories as Category[]).map(cat => cat.id)
            : savedCompany.categories as number[]
          : [],
        rating: savedCompany.rating || 0,
        staff_count: savedCompany.staff_count || 1,
        branches_count: savedCompany.branches_count || 1,
      };
      
      setCompany(processedSavedCompany);
      setFormData(processedSavedCompany);
      setIsEditing(false);
      
      console.log('Company data saved and updated successfully');
      
      // Show success message with actions
      setTimeout(() => {
        toast.success(
          <div className="flex flex-col space-y-2">
            <span>Компания успешно сохранена!</span>
            <div className="flex space-x-2 text-sm">
              <Link to="/dashboard" className="text-primary-300 hover:text-primary-200 underline">
                Перейти в панель
              </Link>
              <span className="text-dark-500">|</span>
              <Link to="/dashboard/products" className="text-primary-300 hover:text-primary-200 underline">
                Добавить товары
              </Link>
            </div>
          </div>,
          { duration: 5000 },
        );
      }, 500);
    } catch (error: any) {
      let errorMessage = 'Ошибка сохранения';
      
      if (error?.response?.status === 403) {
        errorMessage = 'У вас нет прав для редактирования этой компании. Вы можете редактировать только свои компании.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Компания не найдена';
      } else {
        errorMessage = error?.response?.data?.message || 
                      error?.response?.data?.detail ||
                      Object.values(error?.response?.data || {}).flat().join('; ') ||
                      'Ошибка сохранения';
      }
      
      toast.error(errorMessage);
      console.error('Save error:', error);
      console.error('Error response:', error?.response?.data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData(company);
    }
    setIsEditing(false);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      DRAFT: { text: 'Черновик', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Edit3 },
      PENDING: { text: 'На модерации', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
      APPROVED: { text: 'Одобрено', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
      BANNED: { text: 'Заблокировано', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.DRAFT;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  // Show message if user has no companies and we're not in editing mode
  if (!company && !isEditing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-dark-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">У вас пока нет компании</h2>
          <p className="text-dark-300 mb-6 max-w-md mx-auto">
            Создайте профиль своей компании, чтобы начать работу с платформой и привлекать новых клиентов.
          </p>
          <div className="text-sm text-dark-400 mb-6">
            Примечание: Вы можете редактировать только свои собственные компании. Если вы видели компании других пользователей ранее, вам нужно создать свою.
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Создать компанию</span>
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(formData.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Моя компания</h1>
          <p className="text-dark-300">
            {company ? 'Управляйте профилем вашей компании' : 'Создайте профиль вашей компании'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {company && (
            <div className={`flex items-center px-3 py-2 rounded-full ${statusConfig.bg}`}>
              <statusConfig.icon className={`w-4 h-4 mr-2 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.text}
              </span>
            </div>
          )}
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Редактировать</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
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
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-primary-400" />
          Основная информация
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Название компании *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input"
              placeholder="Введите название компании"
              disabled={!isEditing}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Город *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="input"
              placeholder="Москва"
              disabled={!isEditing}
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Описание *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="input min-h-[100px]"
            placeholder="Расскажите о вашей компании, видах деятельности и преимуществах"
            disabled={!isEditing}
            required
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Адрес
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="input"
            placeholder="Введите полный адрес"
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Phone className="w-5 h-5 mr-2 text-secondary-400" />
          Контактная информация
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Телефоны (через запятую)
            </label>
            <input
              type="text"
              value={formData.contacts.phones?.join(', ') || ''}
              onChange={(e) => handleNestedChange('contacts', 'phones', e.target.value.split(',').map(p => p.trim()).filter(p => p))}
              className="input"
              placeholder="+7 (999) 123-45-67, +7 (999) 123-45-68"
              disabled={!isEditing}
            />
            <p className="text-xs text-dark-400 mt-1">Укажите несколько номеров через запятую</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Email адреса (через запятую)
            </label>
            <input
              type="text"
              value={formData.contacts.emails?.join(', ') || ''}
              onChange={(e) => handleNestedChange('contacts', 'emails', e.target.value.split(',').map(e => e.trim()).filter(e => e))}
              className="input"
              placeholder="info@company.com, sales@company.com"
              disabled={!isEditing}
            />
            <p className="text-xs text-dark-400 mt-1">Укажите несколько email через запятую</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Веб-сайт
            </label>
            <input
              type="url"
              value={formData.contacts.website || ''}
              onChange={(e) => handleNestedChange('contacts', 'website', e.target.value)}
              className="input"
              placeholder="https://company.com"
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Социальные сети</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['facebook', 'instagram', 'telegram', 'whatsapp', 'twitter', 'linkedin'].map((platform) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-dark-200 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={formData.contacts.social?.[platform] || ''}
                  onChange={(e) => handleNestedChange('contacts', 'social', {
                    ...formData.contacts.social,
                    [platform]: e.target.value
                  })}
                  className="input"
                  placeholder={`https://${platform}.com/yourcompany`}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Категории деятельности
        </h2>
        
        {isEditing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center p-3 rounded-lg border border-dark-600 hover:border-primary-500 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={Array.isArray(formData.categories) && (formData.categories as number[]).includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  Array.isArray(formData.categories) && (formData.categories as number[]).includes(category.id) 
                    ? 'bg-primary-600 border-primary-600' 
                    : 'border-dark-500'
                }`}>
                  {Array.isArray(formData.categories) && (formData.categories as number[]).includes(category.id) && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-sm text-white">{category.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Array.isArray(formData.categories) && formData.categories.length > 0 ? (
              (formData.categories as number[]).map((categoryId) => {
                const category = categories.find(c => c.id === categoryId);
                return category ? (
                  <span
                    key={category.id}
                    className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-dark-400">Категории не выбраны</span>
            )}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Способы оплаты
        </h2>
        
        {isEditing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className="flex items-center p-3 rounded-lg border border-dark-600 hover:border-primary-500 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.payment_methods.includes(method.value)}
                  onChange={() => handlePaymentMethodToggle(method.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  formData.payment_methods.includes(method.value) 
                    ? 'bg-primary-600 border-primary-600' 
                    : 'border-dark-500'
                }`}>
                  {formData.payment_methods.includes(method.value) && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-sm text-white">{method.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formData.payment_methods.length > 0 ? (
              formData.payment_methods.map((methodValue) => {
                const method = paymentMethods.find(m => m.value === methodValue);
                return method ? (
                  <span
                    key={method.value}
                    className="px-3 py-1 bg-secondary-600/20 text-secondary-300 rounded-full text-sm"
                  >
                    {method.label}
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-dark-400">Способы оплаты не указаны</span>
            )}
          </div>
        )}
      </div>

      {/* Work Schedule */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-green-400" />
          График работы
        </h2>
        
        <div className="space-y-4">
          {weekDays.map((day) => (
            <div key={day.key} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
              <div className="flex items-center">
                {isEditing && (
                  <input
                    type="checkbox"
                    checked={formData.work_schedule[day.key]?.is_working || false}
                    onChange={(e) => handleScheduleChange(day.key, 'is_working', e.target.checked)}
                    className="mr-3"
                  />
                )}
                <span className="text-white font-medium w-32">{day.label}</span>
              </div>
              
              {formData.work_schedule[day.key]?.is_working ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={formData.work_schedule[day.key]?.open || '09:00'}
                    onChange={(e) => handleScheduleChange(day.key, 'open', e.target.value)}
                    className="input py-1 text-sm"
                    disabled={!isEditing}
                  />
                  <span className="text-dark-400">—</span>
                  <input
                    type="time"
                    value={formData.work_schedule[day.key]?.close || '18:00'}
                    onChange={(e) => handleScheduleChange(day.key, 'close', e.target.value)}
                    className="input py-1 text-sm"
                    disabled={!isEditing}
                  />
                </div>
              ) : (
                <span className="text-red-400">Выходной</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            Размер команды
          </h3>
          
          {isEditing ? (
            <input
              type="number"
              min="1"
              value={formData.staff_count}
              onChange={(e) => handleInputChange('staff_count', parseInt(e.target.value) || 1)}
              className="input"
              placeholder="Количество сотрудников"
            />
          ) : (
            <p className="text-2xl font-bold text-white">
              {formData.staff_count} {formData.staff_count === 1 ? 'сотрудник' : 'сотрудников'}
            </p>
          )}
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-purple-400" />
            Филиалы
          </h3>
          
          {isEditing ? (
            <input
              type="number"
              min="1"
              value={formData.branches_count}
              onChange={(e) => handleInputChange('branches_count', parseInt(e.target.value) || 1)}
              className="input"
              placeholder="Количество филиалов"
            />
          ) : (
            <p className="text-2xl font-bold text-white">
              {formData.branches_count} {formData.branches_count === 1 ? 'филиал' : 'филиалов'}
            </p>
          )}
        </div>
      </div>

      {/* Rating */}
      {company && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-400" />
            Рейтинг компании
          </h3>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(formData.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-dark-500'
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-white">
              {(formData.rating || 0).toFixed(1)}
            </span>
            <span className="text-dark-400">из 5</span>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      {company && !isEditing && (
        <div className="card p-6 bg-gradient-to-r from-dark-800 to-dark-700 border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-primary-400" />
            Следующие шаги
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/dashboard"
              className="flex items-center p-4 bg-primary-600/10 hover:bg-primary-600/20 border border-primary-500/20 rounded-lg transition-colors group"
            >
              <Home className="w-6 h-6 text-primary-400 mr-3" />
              <div>
                <div className="text-white font-medium group-hover:text-primary-300">Главная панель</div>
                <div className="text-dark-400 text-sm">Обзор и статистика</div>
              </div>
            </Link>
            
            <Link
              to="/dashboard/products"
              className="flex items-center p-4 bg-secondary-600/10 hover:bg-secondary-600/20 border border-secondary-500/20 rounded-lg transition-colors group"
            >
              <Plus className="w-6 h-6 text-secondary-400 mr-3" />
              <div>
                <div className="text-white font-medium group-hover:text-secondary-300">Добавить товары</div>
                <div className="text-dark-400 text-sm">Заполнить каталог</div>
              </div>
            </Link>
            
            <Link
              to="/dashboard/settings"
              className="flex items-center p-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-lg transition-colors group"
            >
              <Edit3 className="w-6 h-6 text-purple-400 mr-3" />
              <div>
                <div className="text-white font-medium group-hover:text-purple-300">Настройки</div>
                <div className="text-dark-400 text-sm">Управление аккаунтом</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCompany;