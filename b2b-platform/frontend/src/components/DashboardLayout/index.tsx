import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Building2, Package, TrendingUp, Activity, Settings, 
  Menu, X, Home, Upload, LogOut, Star, Calendar,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const DashboardLayout = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Главная',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Моя компания',
      href: '/dashboard/company',
      icon: Building2,
      current: location.pathname === '/dashboard/company',
    },
    {
      name: 'Товары и услуги',
      href: '/dashboard/products',
      icon: Package,
      current: location.pathname === '/dashboard/products',
    },
    {
      name: 'Отзывы',
      href: '/dashboard/reviews',
      icon: Star,
      current: location.pathname === '/dashboard/reviews',
    },
    {
      name: 'Импорт данных',
      href: '/dashboard/import',
      icon: Upload,
      current: location.pathname === '/dashboard/import',
    },
    {
      name: 'Акции',
      href: '/dashboard/actions',
      icon: Activity,
      current: location.pathname === '/dashboard/actions',
    },
    {
      name: 'Настройки',
      href: '/dashboard/settings',
      icon: Settings,
      current: location.pathname === '/dashboard/settings',
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="flex">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
            <Link to="/" className="flex flex-col text-white">
              <span className="text-xl font-bold leading-tight">ORBIZ.ASIA</span>
              <span className="text-xs text-dark-400 uppercase tracking-wider">B2B Platform</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md text-dark-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-8">
            <div className="px-4 mb-6">
              <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Панель поставщика
              </div>
            </div>
            
            <div className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-white' : 'text-dark-400 group-hover:text-white'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-dark-700">
              <div className="px-4 mb-4">
                <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Аккаунт
                </div>
              </div>
              
              <div className="space-y-1 px-2">
                <button
                  onClick={handleLogout}
                  className="group flex items-center w-full px-2 py-2 text-sm font-medium text-dark-300 rounded-md hover:bg-dark-700 hover:text-white transition-colors"
                >
                  <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-dark-400 group-hover:text-white" />
                  Выйти
                </button>
              </div>
            </div>
          </nav>

          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(user?.first_name || user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-white truncate">
                  {user?.first_name || user?.username}
                </p>
                <p className="text-xs text-dark-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar - always visible */}
          <div className="sticky top-0 z-40 flex h-16 bg-dark-800 border-b border-dark-700">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-4 text-dark-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex flex-col text-white hover:text-primary-400 transition-colors">
                  <span className="text-xl font-bold leading-tight">ORBIZ.ASIA</span>
                  <span className="text-xs text-dark-400 uppercase tracking-wider">B2B Platform</span>
                </Link>
                <span className="text-dark-500">|</span>
                <h1 className="text-lg font-medium text-white">Панель поставщика</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="text-sm text-dark-300 hover:text-white transition-colors flex items-center"
                >
                  <Home className="w-4 h-4 mr-1" />
                  Главная панель
                </Link>
                <div className="text-sm text-dark-300">
                  {user?.first_name || user?.username}
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;