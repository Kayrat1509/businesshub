import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Package, Upload, Megaphone, Settings, Menu, X,
  BarChart3, FileText, LogOut, Home,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

const DashboardLayout = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not supplier or admin
  if (user?.role !== 'ROLE_SUPPLIER' && user?.role !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
  };

  const navigation = [
    {
      name: 'Обзор',
      href: '/dashboard',
      icon: BarChart3,
      exact: true,
    },
    {
      name: 'Моя компания',
      href: '/dashboard/company',
      icon: Building2,
    },
    {
      name: 'Продукты и услуги',
      href: '/dashboard/products',
      icon: Package,
    },
    {
      name: 'Импорт данных',
      href: '/dashboard/import',
      icon: Upload,
    },
    {
      name: 'Акции и скидки',
      href: '/dashboard/actions',
      icon: Megaphone,
    },
    {
      name: 'Мои тендеры',
      href: '/dashboard/tenders',
      icon: FileText,
    },
    {
      name: 'Настройки',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 flex flex-col lg:translate-x-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-gradient">
            <Building2 className="w-8 h-8 text-primary-400" />
            <span>B2B Platform</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-dark-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {user?.first_name || user?.username}
              </p>
              <p className="text-dark-300 text-sm">
                {user?.role === 'ROLE_ADMIN' ? 'Администратор' : 'Поставщик'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 space-y-1">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>На главную</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </motion.aside>

      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-dark-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard"
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-all duration-200 font-medium text-lg"
                >
                  Кабинет поставщика
                </Link>
                {location.pathname !== '/dashboard' && (
                  <span className="text-dark-500">→</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                НА ГЛАВНУЮ СТРАНИЦУ
              </Link>
              <div className="text-right">
                <p className="text-white font-medium">
                  {user?.first_name || user?.username}
                </p>
                <p className="text-dark-300 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;