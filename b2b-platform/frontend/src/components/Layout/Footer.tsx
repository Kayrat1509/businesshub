import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark-800 border-t border-dark-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold text-gradient">B2B Platform</span>
            </div>
            <p className="text-dark-300 text-sm leading-relaxed">
              Профессиональная B2B платформа для поиска поставщиков товаров и услуг. 
              Объединяем бизнес и создаем возможности для развития.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-dark-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>info@b2bplatform.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Быстрые ссылки</h3>
            <nav className="space-y-2">
              <Link to="/search" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Поиск компаний
              </Link>
              <Link to="/categories" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Категории
              </Link>
              <Link to="/tenders" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Тендеры
              </Link>
              <Link to="/about" className="block text-dark-300 hover:text-white transition-colors text-sm">
                О платформе
              </Link>
            </nav>
          </div>

          {/* For Business */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Для бизнеса</h3>
            <nav className="space-y-2">
              <Link to="/auth/register" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Регистрация поставщика
              </Link>
              <Link to="/dashboard" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Кабинет поставщика
              </Link>
              <Link to="/help/pricing" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Тарифы
              </Link>
              <Link to="/help/api" className="block text-dark-300 hover:text-white transition-colors text-sm">
                API документация
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Поддержка</h3>
            <nav className="space-y-2">
              <Link to="/help" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Центр помощи
              </Link>
              <Link to="/contact" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Связаться с нами
              </Link>
              <Link to="/privacy" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="block text-dark-300 hover:text-white transition-colors text-sm">
                Условия использования
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-dark-400 text-sm">
            © 2024 B2B Platform. Все права защищены.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-dark-400 text-sm">Сделано с ❤️ для бизнеса</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;