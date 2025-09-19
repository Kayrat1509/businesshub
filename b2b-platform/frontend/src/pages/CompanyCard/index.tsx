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
  FileText,
  MessageSquare,
  User
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCompanyById, toggleFavorite, fetchCompanyTenders } from '../../store/slices/companiesSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import TenderCard from '../../components/TenderCard';
import ProductCard from '../../components/ProductCard';
import { toast } from 'react-hot-toast';
import apiService from '../../api';

interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
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

  // Состояния для отзывов
  const [companyReviews, setCompanyReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCompanyById(Number(id)));
      // Загружаем товары только для текущей компании, используя параметр company
      dispatch(fetchProducts({ page: 1, filters: { company: Number(id) } }));
      dispatch(fetchCompanyTenders(Number(id)));
      loadCompanyReviews(Number(id));
    }
  }, [dispatch, id]);

  const loadCompanyReviews = async (companyId: number) => {
    try {
      setReviewsLoading(true);
      const response = await apiService.get<{results: Review[]}>(`/reviews/?company=${companyId}`);
      console.log('Загруженные отзывы:', response);
      setCompanyReviews(response.results || []);
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
      setCompanyReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || reviewRating === 0) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await apiService.post('/reviews/', {
        company: Number(id),
        rating: reviewRating,
        text: reviewText.trim()
      });

      toast.success('Отзыв отправлен на модерацию');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(0);

      // Перезагружаем отзывы
      if (id) {
        loadCompanyReviews(Number(id));
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка отправки отзыва';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
    const icons: { [key: string]: string } = {
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
    { id: 'reviews', label: 'Отзывы', icon: MessageSquare },
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
              
              <div className="description-expanded text-dark-300 mb-4">
                {company.description}
              </div>
              
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
          <div className="flex flex-row space-x-3 lg:min-w-0 lg:flex-shrink-0" style={{marginLeft: '-350px'}}>
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
                    {Object.entries(company.work_schedule).map(([day, hours]) => {
                      // Обрабатываем случай когда hours это объект с open, close, is_working
                      const displayHours = typeof hours === 'object' && hours !== null 
                        ? (hours as any).is_working 
                          ? `${(hours as any).open} - ${(hours as any).close}`
                          : 'Выходной'
                        : hours as string;
                      
                      return (
                        <div key={day} className="flex justify-between">
                          <span className="text-dark-300 capitalize">{day}:</span>
                          <span className="text-white">{displayHours}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Contact */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Быстрая связь</h3>
                <div className="space-y-3">
                  {company.contacts?.phones && company.contacts.phones.length > 0 ? (
                    company.contacts.phones.map((phone: string, index: number) => (
                      <a
                        key={index}
                        href={`tel:${phone}`}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-primary-400" />
                        <span className="text-white">{phone}</span>
                      </a>
                    ))
                  ) : (
                    <div className="text-dark-400 text-sm">Телефоны не указаны</div>
                  )}
                  
                  {company.contacts?.emails && company.contacts.emails.length > 0 ? (
                    company.contacts.emails.map((email: string, index: number) => (
                      <a
                        key={index}
                        href={`mailto:${email}`}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-primary-400" />
                        <span className="text-white">{email}</span>
                      </a>
                    ))
                  ) : (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showCompany={false}
                    variant="compact"
                  />
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
                {company.contacts?.phones && company.contacts.phones.length > 0 ? (
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
                
                {company.contacts?.emails && company.contacts.emails.length > 0 ? (
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

        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Отзывы о компании
              </h3>
              {isAuthenticated && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Оставить отзыв</span>
                </button>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : !Array.isArray(companyReviews) || companyReviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Отзывов пока нет</h3>
                <p className="text-dark-300">Станьте первым, кто оставит отзыв о компании</p>
              </div>
            ) : (
              <div className="space-y-6">
                {companyReviews.map((review) => (
                  <div key={review.id} className="card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-dark-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{review.author_name}</h4>
                          <p className="text-dark-400 text-sm">
                            {new Date(review.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-dark-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-dark-200 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Форма отзыва */}
            {showReviewForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Оставить отзыв о компании
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Оценка *
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer transition-colors ${
                            star <= reviewRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-dark-500 hover:text-yellow-300'
                          }`}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Отзыв *
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Поделитесь своим опытом работы с компанией..."
                      className="input min-h-[120px]"
                      maxLength={1000}
                    />
                    <p className="text-dark-400 text-xs mt-1">
                      {reviewText.length}/1000 символов
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSubmitReview}
                      disabled={!reviewText.trim() || reviewRating === 0 || isSubmittingReview}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2"
                    >
                      {isSubmittingReview ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Отправка...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>Отправить на модерацию</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewText('');
                        setReviewRating(0);
                      }}
                      className="btn-outline px-4 py-2"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CompanyProfile;