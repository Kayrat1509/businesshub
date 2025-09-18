import React from 'react';
import { Building2, MessageCircle, Users, Target, Globe, Shield, Clock, Search, CheckCircle2, Phone, MapPin } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Building2 className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">О компании ORBIZ</h1>
            <p className="text-xl text-dark-300">Объединяем бизнес. ORBIZ — платформа для эффективного B2B-взаимодействия</p>
          </div>

          <div className="space-y-8">
            {/* Описание компании */}
            <div className="card p-8">
              <p className="text-dark-300 text-lg leading-relaxed">
                Мы соединяем поставщиков и покупателей, помогая находить надёжных партнёров и выстраивать взаимовыгодные сделки по всему СНГ.
              </p>
            </div>

            {/* Наша миссия */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Target className="w-8 h-8 text-primary-400 mr-3" />
                Наша миссия
              </h2>
              <p className="text-dark-300 text-lg leading-relaxed">
                Мы делаем бизнес-поиск простым и безопасным. Наша цель — создать пространство, где компании любого масштаба быстро находят нужных поставщиков и клиентов, экономят время на согласованиях и минимизируют риски при заключении договоров.
              </p>
            </div>

            {/* Что вы получаете с ORBIZ */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Что вы получаете с ORBIZ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-dark-700 p-6 rounded-lg">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Точный поиск
                  </h3>
                  <p className="text-dark-300 text-sm">
                    Умные фильтры и удобная навигация помогают находить именно те компании, товары и услуги, которые соответствуют требованиям вашего проекта.
                  </p>
                </div>

                <div className="bg-dark-700 p-6 rounded-lg">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Широкая география
                  </h3>
                  <p className="text-dark-300 text-sm">
                    Мы работаем по всему СНГ, включая: Казахстан, Узбекистан, Россию, Кыргызстан и Таджикистан. В скором времени на платформе появятся поставщики и контакты китайских производителей, что позволит бизнесу напрямую работать с Китаем.
                  </p>
                </div>

                <div className="bg-dark-700 p-6 rounded-lg">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Безопасность
                  </h3>
                  <p className="text-dark-300 text-sm">
                    Все компании и отзывы проходят модерацию — это снижает риск недобросовестных сделок и повышает качество предложений.
                  </p>
                </div>

                <div className="bg-dark-700 p-6 rounded-lg">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Поддержка 24/7
                  </h3>
                  <p className="text-dark-300 text-sm">
                    Наша команда онлайн и готова оперативно помочь с любыми вопросами: от регистрации до настройки профильных предложений.
                  </p>
                </div>

                <div className="bg-dark-700 p-6 rounded-lg">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Для бизнеса
                  </h3>
                  <p className="text-dark-300 text-sm">
                    Платформа разработана специально под потребности B2B-сектора: карточки компаний, запросы коммерческих предложений, инструменты для быстрой связи.
                  </p>
                </div>
              </div>
            </div>

            {/* Как это работает */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Как это работает (в 4 шага)
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1 text-sm">
                    1
                  </div>
                  <p className="text-dark-300 text-lg">
                    Зарегистрируйтесь и создайте профиль компании.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1 text-sm">
                    2
                  </div>
                  <p className="text-dark-300 text-lg">
                    Используйте точные фильтры, чтобы найти подходящих поставщиков/покупателей.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1 text-sm">
                    3
                  </div>
                  <p className="text-dark-300 text-lg">
                    Свяжитесь напрямую через платформу или по телефону/WhatsApp — согласуйте условия.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1 text-sm">
                    4
                  </div>
                  <p className="text-dark-300 text-lg">
                    Оставьте отзыв и помогите сообществу выбирать лучших партнёров.
                  </p>
                </div>
              </div>
            </div>

            {/* Почему выбирают нас */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Почему выбирают нас
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-dark-300">
                    Экономия времени на поиске и переговорах.
                  </p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-dark-300">
                    Контроль качества через модерацию и систему отзывов.
                  </p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-dark-300">
                    Специализация на B2B — инструменты адаптированы под деловые процессы.
                  </p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-dark-300">
                    Доступность и поддержка в любой точке региона.
                  </p>
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            <div className="card p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                Остались вопросы?
              </h3>
              <p className="text-dark-300 mb-6">
                Мы всегда готовы помочь и ответить на любые вопросы — от выбора тарифов до настройки профиля.
              </p>

              <div className="bg-dark-700 p-6 rounded-lg">
                <h4 className="text-white font-medium mb-3">Свяжитесь с нами прямо сейчас:</h4>
                <a
                  href="https://wa.me/77776323616"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Получить консультацию в WhatsApp
                </a>
                <p className="text-dark-300 mt-3 text-sm">
                  WhatsApp: +7 777 632 36 16
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;