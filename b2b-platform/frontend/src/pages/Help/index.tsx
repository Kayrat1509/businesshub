import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, CreditCard, Shield, Phone, MessageCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const HelpPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const categories: FAQCategory[] = [
    {
      title: 'Работа с платформой',
      icon: <Settings className="w-6 h-6 text-primary-400" />,
      items: [
        {
          question: 'Как зарегистрироваться на ORBIZ.ASIA?',
          answer: 'Нажмите кнопку "Регистрация" в правом верхнем углу сайта. Заполните форму с основной информацией о вашей компании: название, контактные данные, сферу деятельности. После подтверждения email ваш аккаунт будет активирован.'
        },
        {
          question: 'Как добавить компанию и товары?',
          answer: 'После регистрации войдите в личный кабинет. В разделе "Компания" заполните подробную информацию о вашем бизнесе. Затем перейдите в раздел "Товары и услуги" и нажмите "Добавить товар". Заполните описание, загрузите фотографии и укажите цены.'
        },
        {
          question: 'Как редактировать профиль компании?',
          answer: 'В личном кабинете выберите раздел "Компания". Здесь вы можете изменить описание, контакты, логотип, фотографии офиса и другую информацию. Все изменения сохраняются автоматически после нажатия кнопки "Сохранить".'
        },
        {
          question: 'Как найти поставщиков или покупателей?',
          answer: 'Используйте поиск на главной странице или в разделе "Поставщики". Применяйте фильтры по региону, категории товаров, рейтингу компании. Вы можете связаться с интересующими компаниями через профиль или напрямую по телефону/WhatsApp.'
        }
      ]
    },
    {
      title: 'Оплата и тарифы',
      icon: <CreditCard className="w-6 h-6 text-green-400" />,
      items: [
        {
          question: 'Какие есть тарифы и что в них входит?',
          answer: 'Стартовый тариф - бесплатный с полным доступом к платформе. Бизнес тариф (5 000 ₸ единоразово) включает помощь персонального менеджера в заполнении профиля и добавлении до 100 товаров. Подробности на странице "Тарифы".'
        },
        {
          question: 'Какие способы оплаты доступны?',
          answer: 'Мы принимаем оплату через Kaspi QR, банковские карты Visa/MasterCard, банковские переводы. Для корпоративных клиентов доступна оплата по счёту с отсрочкой платежа.'
        },
        {
          question: 'Как оплатить через Kaspi / банковскую карту?',
          answer: 'При выборе тарифа "Бизнес" система автоматически предложит способы оплаты. Выберите Kaspi QR и отсканируйте код, или введите данные банковской карты в защищённой форме. Оплата проходит мгновенно.'
        },
        {
          question: 'Можно ли перейти на другой тариф?',
          answer: 'Поскольку тариф "Бизнес" - это единоразовая услуга помощи в настройке, переход не требуется. После оплаты вы получаете помощь менеджера, а затем продолжаете пользоваться всеми функциями бесплатно.'
        }
      ]
    },
    {
      title: 'Безопасность и доверие',
      icon: <Shield className="w-6 h-6 text-yellow-400" />,
      items: [
        {
          question: 'Как проходит модерация компаний?',
          answer: 'Каждая новая компания проходит проверку в течение 24 часов. Мы проверяем регистрационные данные, контакты, соответствие заявленной деятельности. Компании с подтверждённым статусом отмечаются специальным значком.'
        },
        {
          question: 'Как оставить или проверить отзывы?',
          answer: 'Отзывы могут оставлять только зарегистрированные пользователи после подтверждения факта сотрудничества. На странице компании нажмите "Оставить отзыв", заполните форму. Все отзывы проходят модерацию перед публикацией.'
        },
        {
          question: 'Что делать при подозрении на мошенничество?',
          answer: 'Немедленно свяжитесь с нашей службой поддержки через WhatsApp +7 777 632 36 16 или email. Предоставьте всю доступную информацию: скриншоты переписки, данные компании, детали ситуации. Мы быстро проведём проверку.'
        }
      ]
    },
    {
      title: 'Поддержка и контакты',
      icon: <Phone className="w-6 h-6 text-blue-400" />,
      items: [
        {
          question: 'Как связаться с поддержкой?',
          answer: 'Вы можете связаться с нами через WhatsApp +7 777 632 36 16, написать на email orbiz.asia@gmail.com или использовать форму обратной связи на сайте. Мы отвечаем в течение нескольких часов.'
        },
        {
          question: 'Доступна ли помощь 24/7?',
          answer: 'Да, наша поддержка работает круглосуточно. В рабочие часы (9:00-18:00 по Алматы) отвечаем в течение 30 минут. В остальное время - в течение 2-3 часов.'
        },
        {
          question: 'Есть ли поддержка через WhatsApp / Telegram?',
          answer: 'Да, мы доступны в обоих мессенджерах по номеру +7 777 632 36 16. WhatsApp и Telegram - наши основные каналы поддержки, через которые вы получите самую быструю помощь.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Центр помощи
            </h1>
            <p className="text-xl text-dark-300 mb-8 max-w-3xl mx-auto">
              Найдите ответы на популярные вопросы или свяжитесь с нашей службой поддержки
            </p>
          </div>

          {/* FAQ разделы */}
          <div className="space-y-8">
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="card p-8">
                <div className="flex items-center mb-6">
                  {category.icon}
                  <h2 className="text-2xl font-semibold text-white ml-3">
                    {category.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => {
                    const itemId = `${categoryIndex}-${itemIndex}`;
                    const isOpen = openItems.includes(itemId);

                    return (
                      <div
                        key={itemIndex}
                        className="border border-dark-600 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full px-6 py-4 text-left bg-dark-700 hover:bg-dark-600 transition-colors flex items-center justify-between"
                        >
                          <span className="text-white font-medium">
                            {item.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-dark-300 flex-shrink-0 ml-4" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-dark-300 flex-shrink-0 ml-4" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-6 py-4 bg-dark-800">
                            <p className="text-dark-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Контактная информация */}
          <div className="mt-16 text-center card p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Не нашли ответ на свой вопрос?
            </h2>
            <p className="text-xl text-dark-300 mb-8">
              Наша служба поддержки готова помочь вам в любое время
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://wa.me/77776323616"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center btn-primary px-8 py-3"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Написать в WhatsApp
              </a>
              <a
                href="mailto:orbiz.asia@gmail.com"
                className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
              >
                📧 orbiz.asia@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;