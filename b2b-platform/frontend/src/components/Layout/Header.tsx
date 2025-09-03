import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Settings, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'ROLE_ADMIN') {
return '/admin';
}
    if (user?.role === 'ROLE_SUPPLIER') {
return '/dashboard';
}
    return null;
  };

  return (
    <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold text-gradient hover:opacity-80 transition-opacity"
          >
            <Building2 className="w-8 h-8 text-primary-400" />
            <span>B2B Platform</span>
          </Link>


          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              НА ГЛАВНУЮ СТРАНИЦУ
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {getDashboardLink() && (
                  <Link
                    to={getDashboardLink()!}
                    className="text-dark-300 hover:text-white transition-colors"
                  >
                    {user?.role === 'ROLE_ADMIN' ? 'Админ-панель' : 'Кабинет'}
                  </Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors">
                    <User className="w-4 h-4" />
                    <span>{user?.first_name || user?.username}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link 
                        to="/auth/profile" 
                        className="flex items-center space-x-2 px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Профиль</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/auth/login" 
                  className="text-dark-300 hover:text-white transition-colors"
                >
                  Войти
                </Link>
                <Link 
                  to="/auth/register" 
                  className="btn-primary px-4 py-2"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-800 border-t border-dark-700"
          >
            <nav className="container mx-auto px-4 py-4 space-y-3">
              <Link 
                to="/" 
                className="block text-primary-400 hover:text-primary-300 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                НА ГЛАВНУЮ СТРАНИЦУ
              </Link>
              
              {isAuthenticated ? (
                <>
                  {getDashboardLink() && (
                    <Link
                      to={getDashboardLink()!}
                      className="block text-dark-300 hover:text-white transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user?.role === 'ROLE_ADMIN' ? 'Админ-панель' : 'Кабинет'}
                    </Link>
                  )}
                  <Link 
                    to="/auth/profile" 
                    className="block text-dark-300 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Профиль
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block text-dark-300 hover:text-white transition-colors"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth/login" 
                    className="block text-dark-300 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link 
                    to="/auth/register" 
                    className="block btn-primary text-center py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;