import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  Calendar,
  Clock,
  Heart,
  Share2,
  ArrowLeft,
  ExternalLink,
  Package,
  FileText
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCompanyById, toggleFavorite, fetchCompanyTenders } from '../../store/slices/companiesSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import TenderCard from '../../components/TenderCard';
import { toast } from 'react-hot-toast';

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

const CompanyProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });
  
  const { selectedCompany: company, isLoading, companyTenders, tendersLoading } = useAppSelector(state => state.companies);
  const { products, isLoading: productsLoading } = useAppSelector(state => state.products);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(fetchCompanyById(Number(id)));
      dispatch(fetchProducts({ page: 1, filters: { company_id: Number(id) } }));
      dispatch(fetchCompanyTenders(Number(id)));
    }
  }, [dispatch, id]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите в систему, чтобы добавлять в избранное');
      return;
    }

    if (company) {
      try {
        await dispatch(toggleFavorite(company.id)).unwrap();
        toast.success(
          company.is_favorite 
            ? 'Удалено из избранного' 
            : 'Добавлено в избранное'
        );
      } catch (error) {
        toast.error('Ошибка при обновлении избранного');
      }
    }
  };

  const getStatusBadge = () => {
    if (!company) return null;
    
    const statusConfig = {
      APPROVED: { text: 'Проверено', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      BANNED: { text: 'Заблокировано', color: 'bg-red-500/20 text-red-400' },
      DRAFT: { text: 'Черновик', color: 'bg-gray-500/20 text-gray-400' },
    };
    
    const config = statusConfig[company.status];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getSocialIcon = (platform: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      telegram: '📱',
      whatsapp: '💬',
      twitter: '🐦',
      linkedin: '💼',
      youtube: '📺'
    };
    return icons[platform.toLowerCase()] || '🌐';
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

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Компания не найдена</h1>
          <Link to="/suppliers" className="btn-primary px-6 py-3">
            Вернуться к поставщикам
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: Building2 },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'tenders', label: 'Тендеры', icon: FileText },
    { id: 'contacts', label: 'Контакты', icon: Phone },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link 
        to="/suppliers" 
        className="inline-flex items-center space-x-2 text-dark-300 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад к поставщикам</span>
      </Link>

      {/* Company Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* Logo and basic info */}
          <div className="flex items-start space-x-6 mb-6 lg:mb-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-dark-600 flex items-center justify-center">
                <Building2 className="w-12 h-12 lg:w-16 lg:h-16 text-dark-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    {company.name}
                  </h1>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-300">{company.city}</span>
                    </div>
                    {company.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-medium">{company.rating.toFixed(1)}</span>
                        {company.reviews_count !== undefined && (
                          <span className="text-dark-400 text-sm">({company.reviews_count})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {getStatusBadge()}
                </div>
              </div>
              
              <p className="text-dark-300 mb-4 max-w-2xl">
                {company.description}
              </p>
              
              {/* Categories */}
              {company.categories && company.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.categories.map((category) => (
                    <span
                      key={category.id}
                      className="px-3 py-1 text-sm font-medium rounded-full bg-primary-500/20 text-primary-300"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col space-y-3 lg:min-w-0 lg:flex-shrink-0">
            <button
              onClick={handleToggleFavorite}
              className={`btn flex items-center space-x-2 px-6 py-3 ${
                company.is_favorite
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'btn-outline'
              }`}
            >
              <Heart className={`w-4 h-4 ${company.is_favorite ? 'fill-current' : ''}`} />
              <span>{company.is_favorite ? 'В избранном' : 'В избранное'}</span>
            </button>
            
            <button className="btn-ghost flex items-center space-x-2 px-6 py-3">
              <Share2 className="w-4 h-4" />
              <span>Поделиться</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-dark-700 mb-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-300 hover:text-white hover:border-dark-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Company Stats */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">О компании</h3>
                <div className="space-y-4">
                  {company.staff_count > 0 && (
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-dark-400" />
                      <span className="text-dark-300">Сотрудников: {company.staff_count}</span>
                    </div>
                  )}
                  {company.branches_count > 1 && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-dark-400" />
                      <span className="text-dark-300">Филиалов: {company.branches_count}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <span className="text-dark-300">
                      На платформе с {new Date(company.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Work Schedule */}
              {company.work_schedule && Object.keys(company.work_schedule).length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>График работы</span>
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(company.work_schedule).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-dark-300 capitalize">{day}:</span>
                        <span className="text-white">{hours as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Contact */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Быстрая связь</h3>
                <div className="space-y-3">
                  {company.contacts?.phones?.map((phone: string, index: number) => (
                    <a
                      key={index}
                      href={`tel:${phone}`}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-primary-400" />
                      <span className="text-white">{phone}</span>
                    </a>
                  )) || (
                    <div className="text-dark-400 text-sm">Телефоны не указаны</div>
                  )}
                  
                  {company.contacts?.emails?.map((email: string, index: number) => (
                    <a
                      key={index}
                      href={`mailto:${email}`}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-primary-400" />
                      <span className="text-white">{email}</span>
                    </a>
                  )) || (
                    <div className="text-dark-400 text-sm">Email не указан</div>
                  )}
                  
                  {company.contacts?.website && (
                    <a
                      href={company.contacts.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                    >
                      <Globe className="w-4 h-4 text-primary-400" />
                      <span className="text-white">Веб-сайт</span>
                      <ExternalLink className="w-3 h-3 text-dark-400" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Social Media */}
              {company.contacts?.social && Object.keys(company.contacts.social).length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Социальные сети</h3>
                  <div className="space-y-3">
                    {Object.entries(company.contacts.social).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                      >
                        <span className="text-xl">{getSocialIcon(platform)}</span>
                        <span className="text-white capitalize">{platform}</span>
                        <ExternalLink className="w-3 h-3 text-dark-400 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Товары и услуги ({products.length})
              </h3>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Нет товаров</h3>
                <p className="text-dark-300">Компания пока не добавила товары или услуги</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="card p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_service 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {product.is_service ? 'Услуга' : 'Товар'}
                      </span>
                      {product.price && (
                        <div className="text-primary-400 font-semibold">
                          {product.price} {product.currency}
                        </div>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {product.title}
                    </h4>
                    
                    <p className="text-dark-300 text-sm mb-4 line-clamp-3">
                      {product.description}
                    </p>
                    
                    <button className="w-full btn-outline py-2 text-sm">
                      Подробнее
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'tenders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Тендеры компании ({companyTenders.length})
              </h3>
            </div>
            
            {tendersLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : companyTenders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Нет тендеров</h3>
                <p className="text-dark-300">Компания пока не создала ни одного тендера</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companyTenders.map((tender, index) => (
                  <div
                    key={tender.id}
                    className="transform transition-transform duration-300 hover:scale-105"
                  >
                    <TenderCard tender={tender} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Контактная информация</h3>
              <div className="space-y-4">
                {company.contacts?.phones?.length > 0 ? (
                  <div>
                    <div className="text-dark-400 text-sm mb-2">Телефоны:</div>
                    {company.contacts.phones.map((phone: string, index: number) => (
                      <a
                        key={index}
                        href={`tel:${phone}`}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-dark-700 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-primary-400" />
                        <span className="text-white">{phone}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-dark-400 text-sm">Телефоны не указаны</div>
                )}
                
                {company.contacts?.emails?.length > 0 ? (
                  <div>
                    <div className="text-dark-400 text-sm mb-2">Email:</div>
                    {company.contacts.emails.map((email: string, index: number) => (
                      <a
                        key={index}
                        href={`mailto:${email}`}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-dark-700 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-primary-400" />
                        <span className="text-white">{email}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-dark-400 text-sm">Email не указан</div>
                )}
                
                {company.contacts?.website && (
                  <div>
                    <div className="text-dark-400 text-sm mb-2">Веб-сайт:</div>
                    <a
                      href={company.contacts.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-2 rounded hover:bg-dark-700 transition-colors"
                    >
                      <Globe className="w-4 h-4 text-primary-400" />
                      <span className="text-white">{company.contacts.website}</span>
                      <ExternalLink className="w-3 h-3 text-dark-400" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Address */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Адрес</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary-400 mt-1" />
                  <div>
                    <div className="text-white font-medium">{company.city}</div>
                    <div className="text-dark-300">{company.address}</div>
                  </div>
                </div>
                
                {/* Map placeholder */}
                <div className="bg-dark-700 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-dark-400 mx-auto mb-2" />
                    <p className="text-dark-400">Карта будет доступна в следующих обновлениях</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CompanyProfile;