import React from 'react';
import { Building2, MessageCircle, Users, Target, Globe, Shield } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Building2 className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">О платформе</h1>
            <p className="text-xl text-dark-300">Страница находится в разработке</p>
          </div>

          <div className="space-y-8">
            {/* Главная карточка */}
            <div className="card p-8 text-center">
              <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-primary-400" />
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">
                B2B Platform - Ваш надежный партнер в бизнесе
              </h2>
              <p className="text-dark-300 text-lg mb-6">
                Мы работаем над полным описанием нашей платформы. В скором времени здесь появится подробная информация о наших возможностях и преимуществах.
              </p>
            </div>

            {/* Карточки с возможностями */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Объединяем бизнес
                </h3>
                <p className="text-dark-300 text-sm">
                  Соединяем поставщиков и покупателей для взаимовыгодного сотрудничества
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Точный поиск
                </h3>
                <p className="text-dark-300 text-sm">
                  Находите именно то, что нужно вашему бизнесу с помощью умных фильтров
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Широкая география
                </h3>
                <p className="text-dark-300 text-sm">
                  Работаем по всему Казахстану и странам СНГ
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Безопасность
                </h3>
                <p className="text-dark-300 text-sm">
                  Модерация компаний и отзывов для вашей безопасности
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Поддержка 24/7
                </h3>
                <p className="text-dark-300 text-sm">
                  Наша команда всегда готова помочь решить любые вопросы
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Для бизнеса
                </h3>
                <p className="text-dark-300 text-sm">
                  Специально разработано для потребностей B2B сектора
                </p>
              </div>
            </div>

            {/* Контактная информация */}
            <div className="card p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                Остались вопросы?
              </h3>
              <p className="text-dark-300 mb-6">
                Мы всегда готовы ответить на ваши вопросы и помочь начать работу с платформой
              </p>

              <div className="bg-dark-700 p-6 rounded-lg">
                <h4 className="text-white font-medium mb-3">Свяжитесь с нами прямо сейчас</h4>
                <p className="text-dark-300 mb-4">Получите консультацию через WhatsApp</p>
                <a
                  href="https://wa.me/77776323616"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp: +7 777 632 36 16
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;