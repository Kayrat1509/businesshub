import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Package, Star, TrendingUp, Users, Eye,
  Plus, Calendar, ArrowUpRight, Activity,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import LoadingSpinner from '../../components/LoadingSpinner';

const SupplierDashboard = () => {
  const { user } = useAppSelector(state => state.auth);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [stats] = useState({
    views: 1250,
    inquiries: 24,
    rating: 4.8,
    totalReviews: 156,
  });

  useEffect(() => {
    // Load mock data for demonstration
    if (user) {
      loadMockData();
    }
  }, [user]);

  const loadMockData = () => {
    // Simulate loading with mock companies and products
    const mockCompanies = [
      {
        id: 1,
        name: 'ТОО АДАЛ САУДА',
        status: 'APPROVED',
        city: 'Алматы',
        rating: 4.8,
      },
    ];

    const mockProducts = [
      {
        id: 1,
        title: 'Смеситель для кухни',
        description: 'Качественный смеситель из нержавеющей стали',
        category: { name: 'Сантехника' },
        price: 15000,
        is_active: true,
        images: [],
      },
      {
        id: 2,
        title: 'Кабель ВВГ 3x2.5',
        description: 'Медный кабель для электропроводки',
        category: { name: 'Электрика' },
        price: 250,
        is_active: true,
        images: [],
      },
      {
        id: 3,
        title: 'Краска водоэмульсионная',
        description: 'Краска для внутренних работ, белая',
        category: { name: 'Лакокрасочные материалы' },
        price: 800,
        is_active: true,
        images: [],
      },
    ];

    setCompanies(mockCompanies);
    setProducts(mockProducts);
  };

  const userCompany = companies.find(company => company.owner_name === user?.username) || companies[0];

  const dashboardCards = [
    {
      title: 'Карточка компании',
      description: userCompany ? 'Управление профилем' : 'Создать компанию',
      icon: Building2,
      color: 'from-primary-600 to-primary-500',
      link: '/dashboard/company',
      value: userCompany?.name || 'Не создана',
      status: userCompany?.status,
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
                {card.status && getStatusBadge(card.status)}
                {card.change && (
                  <span className="flex items-center text-green-400 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {card.change}
                  </span>
                )}
              </div>
              
              <h3 className="text-white font-semibold mb-1">{card.title}</h3>
              <p className="text-dark-300 text-sm mb-3">{card.description}</p>
              
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
            Статус компании
          </h3>
          
          {userCompany ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Название:</span>
                <span className="text-white font-medium">{userCompany.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Город:</span>
                <span className="text-white">{userCompany.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Статус:</span>
                {getStatusBadge(userCompany.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Рейтинг:</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white">{userCompany.rating.toFixed(1)}</span>
                </div>
              </div>
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
                  <th className="pb-3 text-dark-300 font-medium">Статус</th>
                  <th className="pb-3 text-dark-300 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map((product) => (
                  <tr key={product.id} className="border-b border-dark-800">
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        {product.images && product.images[0] && (
                          <img 
                            src={product.images[0].image} 
                            alt={product.title || product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
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
                        {product.price ? `₸${product.price.toLocaleString()}` : 'По запросу'}
                      </span>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(product.status || (product.is_active ? 'APPROVED' : 'DRAFT'))}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Link 
                          to={`/dashboard/products/${product.id}/edit`}
                          className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                          Редактировать
                        </Link>
                        <span className="text-dark-600">|</span>
                        <button className="text-red-400 hover:text-red-300 text-sm">
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
            <h4 className="text-lg font-semibold text-white mb-2">Товары не добавлены</h4>
            <p className="text-dark-300 mb-6">
              Начните с добавления первого товара в ваш каталог
            </p>
            <Link to="/dashboard/products/create" className="btn-primary">
              Добавить товар
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SupplierDashboard;