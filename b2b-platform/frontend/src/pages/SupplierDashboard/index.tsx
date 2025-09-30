import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Package, Star, TrendingUp, Users, Eye,
  Plus, Calendar, ArrowUpRight, Activity, FileText, Edit3, Zap, Tag,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiService from '../../api'; // Единый API слой для загрузки реальных данных
import { toast } from 'react-hot-toast';

const SupplierDashboard = () => {
  const { user } = useAppSelector(state => state.auth);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]); // Состояние для тендеров пользователя
  const [actions, setActions] = useState<any[]>([]); // Состояние для акций пользователя
  const [isLoading, setIsLoading] = useState(false);

  const [stats] = useState({
    views: 1250,
    inquiries: 24,
    rating: 4.8,
    totalReviews: 156,
  });

  useEffect(() => {
    // Загружаем реальные данные пользователя через API
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Загружаем компании пользователя в первую очередь
      console.log('Загружаем компании пользователя...');
      try {
        const companiesData = await apiService.get<{ results: any[] }>('/companies/?owner=me');
        console.log('Данные компаний получены:', companiesData);

        if (companiesData && Array.isArray(companiesData.results)) {
          setCompanies(companiesData.results);
          console.log('Компании установлены:', companiesData.results.length);
        } else {
          console.error('Получены некорректные данные компаний:', companiesData);
          setCompanies([]);
        }
      } catch (companyError) {
        console.error('Ошибка загрузки компаний:', companyError);
        setCompanies([]);
      }

      // Загружаем товары пользователя (используем правильный endpoint)
      try {
        const productsData = await apiService.get<{ results: any[] }>('/products/my/');
        if (productsData && Array.isArray(productsData.results)) {
          setProducts(productsData.results);
        } else {
          console.log('Нет товаров или некорректные данные товаров:', productsData);
          setProducts([]);
        }
      } catch (productError) {
        console.error('Ошибка загрузки товаров:', productError);
        setProducts([]);
      }

      // Загружаем тендеры пользователя
      try {
        const tendersData = await apiService.get<{ results: any[] }>('/tenders/?owner=me');
        if (tendersData && Array.isArray(tendersData.results)) {
          setTenders(tendersData.results);
        } else if (tendersData && Array.isArray(tendersData)) {
          setTenders(tendersData);
        } else {
          console.log('Нет тендеров или некорректные данные тендеров:', tendersData);
          setTenders([]);
        }
      } catch (tenderError) {
        console.error('Ошибка загрузки тендеров:', tenderError);
        setTenders([]);
      }

      // Загружаем акции пользователя
      try {
        const actionsData = await apiService.get<{ results: any[] }>('/ads/actions/my/');
        if (actionsData && Array.isArray(actionsData.results)) {
          setActions(actionsData.results);
        } else if (Array.isArray(actionsData)) {
          setActions(actionsData);
        } else {
          console.log('Нет акций или некорректные данные акций:', actionsData);
          setActions([]);
        }
      } catch (actionError) {
        console.error('Ошибка загрузки акций:', actionError);
        setActions([]);
      }
    } catch (error) {
      console.error('Общая ошибка загрузки данных пользователя:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик удаления товара
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      await apiService.delete(`/products/${productId}/`);
      toast.success('Продукт успешно удален');
      // Обновляем список товаров, удаляя конкретный товар без перезагрузки страницы
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    } catch (error: any) {
      console.error('Ошибка удаления товара:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при удалении товара';
      toast.error(errorMessage);
    }
  };

  // Обработчик переключения статуса акции товара
  const handleToggleProductSale = async (productId: number, currentSaleStatus: boolean) => {
    try {
      const newStatus = !currentSaleStatus;
      await apiService.patch(`/products/${productId}/`, {
        on_sale: newStatus
      });

      const message = newStatus
        ? 'Товар добавлен в акцию!'
        : 'Товар исключен из акции!';
      toast.success(message);

      // Обновляем только состояние конкретного товара, без перезагрузки всей страницы
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId
            ? { ...product, on_sale: newStatus }
            : product
        )
      );
    } catch (error: any) {
      console.error('Ошибка изменения статуса акции:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при изменении статуса акции';
      toast.error(errorMessage);
    }
  };

  // Обработчик удаления тендера
  const handleDeleteTender = async (tenderId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тендер?')) {
      return;
    }

    try {
      await apiService.delete(`/tenders/${tenderId}/`);
      toast.success('Тендер успешно удален');
      // Обновляем список тендеров, удаляя конкретный тендер без перезагрузки страницы
      setTenders(prevTenders => prevTenders.filter(tender => tender.id !== tenderId));
    } catch (error: any) {
      console.error('Ошибка удаления тендера:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при удалении тендера';
      toast.error(errorMessage);
    }
  };

  // Обработчик удаления акции
  const handleDeleteAction = async (actionId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту акцию?')) {
      return;
    }

    try {
      await apiService.delete(`/ads/actions/${actionId}/`);
      toast.success('Акция успешно удалена');
      // Обновляем список акций, удаляя конкретную акцию без перезагрузки страницы
      setActions(prevActions => prevActions.filter(action => action.id !== actionId));
    } catch (error: any) {
      console.error('Ошибка удаления акции:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при удалении акции';
      toast.error(errorMessage);
    }
  };

  // Все компании пользователя уже отфильтрованы через API, поэтому просто берем их все
  const userCompanies = companies;

  const dashboardCards = [
    {
      title: 'Мои компании',
      description: companies.length > 0 ? `${companies.length} ${companies.length === 1 ? 'компания' : companies.length < 5 ? 'компании' : 'компаний'}` : 'Создать компанию',
      icon: Building2,
      color: 'from-primary-600 to-primary-500',
      link: '/dashboard/company',
      value: companies.length > 0 ? `${companies.length} шт.` : 'Добавить компанию',
      companies: companies, // Передаем все компании для отображения статусов
    },
    {
      title: 'Карточка товаров',
      description: 'Управление каталогом',
      icon: Package,
      color: 'from-secondary-600 to-secondary-500',
      link: '/dashboard/products',
      value: `${products.length} позиций`,
      action: 'Добавить',
    },
    {
      title: 'Отзывы',
      description: 'Отзывы клиентов',
      icon: Star,
      color: 'from-yellow-600 to-yellow-500',
      link: '/dashboard/reviews',
      value: `${stats.rating}/5.0`,
      subValue: `${stats.totalReviews} отзывов`,
    },
    {
      title: 'Просмотры',
      description: 'За последний месяц',
      icon: Eye,
      color: 'from-green-600 to-green-500',
      link: '/dashboard/analytics',
      value: stats.views.toLocaleString(),
      change: '+12%',
    },
  ];

  const quickActions = [
    {
      title: 'Добавить товар',
      description: 'Создать новую позицию',
      icon: Plus,
      link: '/dashboard/products/create',
      color: 'bg-primary-600 hover:bg-primary-700',
    },
    {
      title: 'Импорт товаров',
      description: 'Загрузить из Excel',
      icon: TrendingUp,
      link: '/dashboard/import',
      color: 'bg-secondary-600 hover:bg-secondary-700',
    },
    {
      title: 'Создать акции',
      description: 'Привлечь клиентов',
      icon: Activity,
      link: '/dashboard/actions/create',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Добавить тендер',
      description: 'Создать новый тендер',
      icon: Calendar,
      link: '/dashboard/tenders/create',
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  const getStatusBadge = (status?: string) => {
    if (!status) {
return null;
}
    
    const statusConfig = {
      APPROVED: { text: 'Одобрено', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      BANNED: { text: 'Заблокировано', color: 'bg-red-500/20 text-red-400' },
      DRAFT: { text: 'Черновик', color: 'bg-gray-500/20 text-gray-400' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) {
return null;
}
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Добро пожаловать, {user?.first_name || user?.username}!
            </h1>
            <p className="text-dark-300 text-lg">
              Управляйте своим бизнесом и развивайте продажи
            </p>
          </div>
          <div className="text-right">
            <p className="text-dark-300 text-sm">Сегодня</p>
            <p className="text-white font-semibold">
              {new Date().toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className="block card p-6 hover:shadow-glow transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {card.companies && card.companies.length > 0 ? (
                    card.companies.slice(0, 3).map((company: any, idx: number) => (
                      <div key={company.id} className="text-right">
                        {getStatusBadge(company.status)}
                      </div>
                    ))
                  ) : (
                    card.status && getStatusBadge(card.status)
                  )}
                  {card.companies && card.companies.length > 3 && (
                    <span className="text-xs text-dark-400">
                      +{card.companies.length - 3} еще
                    </span>
                  )}
                  {card.change && (
                    <span className="flex items-center text-green-400 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {card.change}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="text-white font-semibold mb-1">{card.title}</h3>
              <p className="text-dark-300 text-sm mb-3">{card.description}</p>

              {/* Список компаний для карточки компаний */}
              {card.companies && card.companies.length > 0 && (
                <div className="mb-3 space-y-1">
                  {card.companies.slice(0, 2).map((company: any) => (
                    <div key={company.id} className="flex items-center justify-between text-xs">
                      <span className="text-dark-300 truncate flex-1 mr-2">
                        {company.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        company.status === 'APPROVED'
                          ? 'bg-green-500/20 text-green-400'
                          : company.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {company.status === 'APPROVED' ? 'Активна' :
                         company.status === 'PENDING' ? 'Модерация' : 'Заблокирована'}
                      </span>
                    </div>
                  ))}
                  {card.companies.length > 2 && (
                    <p className="text-xs text-dark-400">
                      и еще {card.companies.length - 2} компаний...
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  {card.subValue && (
                    <p className="text-dark-400 text-sm">{card.subValue}</p>
                  )}
                </div>
                {card.action && (
                  <span className="text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {card.action} →
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-3 text-primary-400" />
          Быстрые действия
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              to={action.link}
              className={`p-6 rounded-xl ${action.color} transition-all duration-200 hover:scale-105 text-white group`}
            >
              <div className="flex items-start justify-between mb-4">
                <action.icon className="w-8 h-8" />
                <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-white/80 text-sm">{action.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Company Status */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary-400" />
            Мои компании ({userCompanies.length})
          </h3>
          
          {userCompanies.length > 0 ? (
            <div className="space-y-6">
              {userCompanies.map((company, index) => (
                <div key={company.id} className="border border-dark-600 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-300">Название:</span>
                      <span className="text-white font-medium">{company.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-300">Город:</span>
                      <span className="text-white">{company.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-300">Статус:</span>
                      {getStatusBadge(company.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-300">Рейтинг:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white">{company.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Кнопка редактирования конкретной компании */}
                    <div className="mt-4 pt-3 border-t border-dark-700">
                      <Link
                        to={`/dashboard/company/${company.id}`}
                        className="flex items-center justify-center w-full px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 hover:text-primary-200 rounded-lg transition-colors group"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        <span>Редактировать компанию</span>
                      </Link>
                    </div>
                  </div>
                  {index < userCompanies.length - 1 && <hr className="border-dark-600 mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-300 mb-4">У вас еще нет компании</p>
              <Link to="/dashboard/company" className="btn-primary">
                Создать компанию
              </Link>
            </div>
          )}
        </div>

        {/* Products Summary */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-secondary-400" />
            Каталог товаров
          </h3>
          
          {products.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Всего позиций:</span>
                <span className="text-white font-medium">{products.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">В наличии:</span>
                <span className="text-green-400">{Math.floor(products.length * 0.8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Услуги:</span>
                <span className="text-blue-400">{Math.floor(products.length * 0.3)}</span>
              </div>
              <Link 
                to="/dashboard/products" 
                className="btn-outline w-full text-center"
              >
                Управление каталогом
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-300 mb-4">Ваш каталог пуст</p>
              <Link to="/dashboard/products" className="btn-secondary">
                Добавить товары
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-secondary-400" />
          Список добавленных товаров
        </h3>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="pb-3 text-dark-300 font-medium">Название</th>
                  <th className="pb-3 text-dark-300 font-medium">Категория</th>
                  <th className="pb-3 text-dark-300 font-medium">Цена</th>
                  <th className="pb-3 text-dark-300 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map((product) => (
                  <tr key={product.id} className="border-b border-dark-800">
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title || product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-dark-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{product.title || product.name}</p>
                          <p className="text-dark-400 text-sm">{product.description?.slice(0, 50)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-dark-700 text-dark-300 text-sm rounded">
                        {product.category?.name || product.category || 'Без категории'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-white font-medium">
                        {product.price ? (() => {
                          // Определяем символ валюты
                          const getCurrencySymbol = (currency: string) => {
                            switch (currency) {
                              case 'USD': return '$';
                              case 'RUB': return '₽';
                              case 'KZT':
                              default: return '₸';
                            }
                          };
                          const symbol = getCurrencySymbol(product.currency);
                          return `${symbol}${product.price.toLocaleString()}`;
                        })() : 'Договорная'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/dashboard/products/edit/${product.id}`}
                          className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                          Управление
                        </Link>
                        <span className="text-dark-600">|</span>
                        <button
                          onClick={() => handleToggleProductSale(product.id, product.on_sale)}
                          className={`flex items-center text-sm px-2 py-1 rounded transition-colors ${
                            product.on_sale
                              ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                              : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                          }`}
                          title={product.on_sale ? 'Исключить из акции' : 'Добавить в акцию'}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {product.on_sale ? 'В акции' : 'В акцию'}
                        </button>
                        <span className="text-dark-600">|</span>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-400 hover:text-red-300 text-sm hover:bg-red-500/10 px-1 py-0.5 rounded transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products.length > 10 && (
              <div className="mt-4 text-center">
                <Link to="/dashboard/products" className="btn-outline px-6 py-2">
                  Посмотреть все {products.length} товаров
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Продукты не добавлены</h4>
            <p className="text-dark-300 mb-6">
              Начните с добавления первого товара в ваш каталог
            </p>
            <Link to="/dashboard/products/create" className="btn-primary">
              Добавить товар
            </Link>
          </div>
        )}
      </motion.div>

      {/* Tenders Table - Список добавленных тендеров */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="card p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-green-400" />
          Список добавленных тендеров
        </h3>

        {tenders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="pb-3 text-dark-300 font-medium">Название</th>
                  <th className="pb-3 text-dark-300 font-medium">Город</th>
                  <th className="pb-3 text-dark-300 font-medium">Бюджет</th>
                  <th className="pb-3 text-dark-300 font-medium">Дедлайн</th>
                  <th className="pb-3 text-dark-300 font-medium">Статус</th>
                  <th className="pb-3 text-dark-300 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {tenders.slice(0, 10).map((tender: any) => (
                  <tr key={tender.id} className="border-b border-dark-800">
                    <td className="py-3">
                      <div>
                        <p className="text-white font-medium">{tender.title}</p>
                        <p className="text-dark-400 text-sm">{tender.description?.slice(0, 50)}...</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-white">
                        {tender.city || 'Не указан'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-white font-medium">
                        {tender.budget_min && tender.budget_max 
                          ? `₸${tender.budget_min.toLocaleString()} - ₸${tender.budget_max.toLocaleString()}`
                          : tender.budget_min
                            ? `от ₸${tender.budget_min.toLocaleString()}`
                            : tender.budget_max
                              ? `до ₸${tender.budget_max.toLocaleString()}`
                              : 'По договоренности'
                        }
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-white">
                        {tender.deadline_date 
                          ? new Date(tender.deadline_date).toLocaleDateString('ru-RU')
                          : 'Не указан'
                        }
                      </span>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(tender.status || 'PENDING')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Link 
                          to="/dashboard/tenders"
                          className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                          Управление
                        </Link>
                        <span className="text-dark-600">|</span>
                        <button 
                          onClick={() => handleDeleteTender(tender.id)}
                          className="text-red-400 hover:text-red-300 text-sm hover:bg-red-500/10 px-1 py-0.5 rounded transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {tenders.length > 10 && (
              <div className="mt-4 text-center">
                <Link to="/dashboard/tenders" className="btn-outline px-6 py-2">
                  Посмотреть все {tenders.length} тендеров
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Тендеры не добавлены</h4>
            <p className="text-dark-300 mb-6">
              Создайте ваш первый тендер для поиска поставщиков
            </p>
            <Link to="/dashboard/tenders/create" className="btn-primary">
              Создать тендер
            </Link>
          </div>
        )}
      </motion.div>

      {/* Actions Table - Список объявленных акций */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="card p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-400" />
          Список объявленных акций
        </h3>

        {actions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="pb-3 text-dark-300 font-medium">Название</th>
                  <th className="pb-3 text-dark-300 font-medium">Период</th>
                  <th className="pb-3 text-dark-300 font-medium">Статус</th>
                  <th className="pb-3 text-dark-300 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {actions.slice(0, 10).map((action: any) => {
                  // Функция для получения статуса акции
                  const getActionStatus = () => {
                    const now = new Date();
                    const startDate = new Date(action.starts_at);
                    const endDate = new Date(action.ends_at);

                    if (!action.is_active) {
                      return { text: 'Отключена', color: 'bg-gray-500/20 text-gray-400' };
                    }

                    if (now < startDate) {
                      return { text: 'Запланирована', color: 'bg-blue-500/20 text-blue-400' };
                    }

                    if (now >= startDate && now <= endDate) {
                      return { text: 'Активна', color: 'bg-green-500/20 text-green-400' };
                    }

                    return { text: 'Завершена', color: 'bg-red-500/20 text-red-400' };
                  };

                  const status = getActionStatus();

                  return (
                    <tr key={action.id} className="border-b border-dark-800">
                      <td className="py-3">
                        <div>
                          <p className="text-white font-medium">{action.title}</p>
                          <p className="text-dark-400 text-sm">{action.description?.slice(0, 50)}...</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm">
                          <p className="text-white">
                            {new Date(action.starts_at).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-dark-400">
                            до {new Date(action.ends_at).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/dashboard/actions/edit/${action.id}`}
                            className="text-primary-400 hover:text-primary-300 text-sm"
                          >
                            Редактировать
                          </Link>
                          <span className="text-dark-600">|</span>
                          <button
                            onClick={() => handleDeleteAction(action.id)}
                            className="text-red-400 hover:text-red-300 text-sm hover:bg-red-500/10 px-1 py-0.5 rounded transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {actions.length > 10 && (
              <div className="mt-4 text-center">
                <Link to="/dashboard/actions" className="btn-outline px-6 py-2">
                  Посмотреть все {actions.length} акций
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Zap className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Акции не объявлены</h4>
            <p className="text-dark-300 mb-6">
              Создайте первую акцию для привлечения клиентов
            </p>
            <Link to="/dashboard/actions/create" className="btn-primary">
              Создать акцию
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SupplierDashboard;