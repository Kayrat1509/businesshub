import React from 'react';
import { Shield, MessageCircle, Mail, Phone } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">Политика конфиденциальности</h1>
            <p className="text-dark-300">Дата обновления: 18 сентября 2025 г.</p>
          </div>

          {/* Основное содержание */}
          <div className="card p-8 space-y-8">
            {/* Введение */}
            <div>
              <p className="text-dark-300 text-lg leading-relaxed">
                Компания ORBIZ.ASIA уважает конфиденциальность своих пользователей и обязуется защищать их персональные данные.
                Настоящая политика объясняет, какие данные мы собираем, как их используем и какие у вас есть права.
              </p>
            </div>

            {/* 1. Общие положения */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Общие положения</h2>
              <div className="space-y-3 text-dark-300">
                <p>1.1. Настоящая Политика конфиденциальности регулирует обработку персональных данных пользователей платформы ORBIZ.ASIA.</p>
                <p>1.2. Используя наш сайт и сервисы, вы соглашаетесь с условиями данной Политики.</p>
              </div>
            </div>

            {/* 2. Какие данные мы собираем */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Какие данные мы собираем</h2>
              <p className="text-dark-300 mb-4">Мы можем собирать следующие данные:</p>
              <div className="space-y-3 text-dark-300">
                <p><strong>Данные при регистрации:</strong> название компании, номер телефона, адрес электронной почты.</p>
                <p><strong>Информация о товарах и услугах,</strong> которые вы добавляете на платформу.</p>
                <p><strong>Технические данные:</strong> IP-адрес, данные о браузере и устройстве, cookies, история действий на сайте.</p>
              </div>
            </div>

            {/* 3. Как мы используем данные */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Как мы используем данные</h2>
              <p className="text-dark-300 mb-4">Ваши данные используются для:</p>
              <ul className="space-y-2 text-dark-300 list-disc list-inside ml-4">
                <li>предоставления доступа к сервисам ORBIZ.ASIA;</li>
                <li>настройки профиля компании и публикации товаров/услуг;</li>
                <li>связи с вами (уведомления, новости, поддержка);</li>
                <li>обработки платежей и выставления счетов;</li>
                <li>анализа работы сайта и улучшения сервиса.</li>
              </ul>
            </div>

            {/* 4. Передача данных третьим лицам */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Передача данных третьим лицам</h2>
              <div className="space-y-3 text-dark-300">
                <p>4.1. Мы не продаём и не передаём ваши персональные данные третьим лицам без вашего согласия.</p>
                <p>4.2. Данные могут быть переданы только в случаях:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>выполнения требований законодательства;</li>
                  <li>партнёрам и сервисам, обеспечивающим работу сайта, оплату и хостинг (например, Kaspi, провайдеры связи).</li>
                </ul>
              </div>
            </div>

            {/* 5. Хранение и защита данных */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Хранение и защита данных</h2>
              <ul className="space-y-2 text-dark-300 list-disc list-inside ml-4">
                <li>Данные хранятся на защищённых серверах.</li>
                <li>Передача информации осуществляется через зашифрованное соединение (SSL/HTTPS).</li>
                <li>Доступ к данным имеют только уполномоченные сотрудники.</li>
              </ul>
            </div>

            {/* 6. Cookies и аналитика */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies и аналитика</h2>
              <div className="space-y-3 text-dark-300">
                <p>6.1. Мы используем cookies для удобства работы и персонализации контента.</p>
                <p>6.2. Также можем применять системы аналитики (например, Google Analytics) для изучения посещаемости и улучшения функционала.</p>
                <p>6.3. Вы можете отключить cookies в настройках браузера, но это может повлиять на работу сайта.</p>
              </div>
            </div>

            {/* 7. Права пользователя */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Права пользователя</h2>
              <p className="text-dark-300 mb-4">Вы имеете право:</p>
              <ul className="space-y-2 text-dark-300 list-disc list-inside ml-4">
                <li>изменять или удалять свои данные в личном кабинете;</li>
                <li>отказаться от рассылок и уведомлений;</li>
                <li>запросить удаление аккаунта и данных, написав на orbiz.asia@gmail.com.</li>
              </ul>
            </div>

            {/* 8. Изменения политики */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Изменения политики</h2>
              <p className="text-dark-300">
                Мы можем вносить изменения в настоящую Политику конфиденциальности. Дата последнего обновления всегда указывается вверху страницы.
              </p>
            </div>

            {/* 9. Контакты */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Контакты</h2>
              <p className="text-dark-300 mb-4">Если у вас есть вопросы, свяжитесь с нами:</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:orbiz.asia@gmail.com"
                  className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  orbiz.asia@gmail.com
                </a>
                <a
                  href="tel:+77776323616"
                  className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  +7 777 632 36 16
                </a>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="mt-8 text-center card p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Остались вопросы?
            </h3>
            <p className="text-dark-300 mb-6">
              Свяжитесь с нами для получения дополнительной информации
            </p>
            <a
              href="https://wa.me/77776323616"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center btn-primary px-8 py-3"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;