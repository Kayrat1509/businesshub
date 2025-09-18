import React from 'react';
import { Check, Star, Building2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Стартовый',
      price: 'Бесплатно',
      period: '',
      description: 'Формат самообслуживания для компаний, которым нужен полный доступ к платформе без ограничений.',
      features: [
        'Все функции платформы доступны',
        'Неограниченное количество товаров и услуг',
        'Просмотр контактов поставщиков',
        'Поддержка 24/7',
        'Умные фильтры поиска'
      ],
      buttonText: 'Начать бесплатно',
      buttonLink: '/auth/register',
      popular: false,
      color: 'border-dark-600'
    },
    {
      name: 'Бизнес',
      price: '5 000 ₸',
      period: ' — единоразовый платёж',
      description: 'Идеально для растущих компаний, которым нужен расширенный функционал и помощь при запуске.',
      features: [
        'Всё, что доступно в бесплатном тарифе',
        'Выделим персонального менеджера для заполнения анкеты компании',
        'Добавление до 100 товаров и услуг с помощью менеджера компании'
      ],
      buttonText: 'Подключить тариф «Бизнес»',
      buttonLink: '/auth/register?plan=business',
      popular: true,
      color: 'border-primary-500'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Выберите подходящий тариф
            </h1>
            <p className="text-xl text-dark-300 mb-8 max-w-3xl mx-auto">
              Масштабируйте свой бизнес с ORBIZ.ASIA. Все планы включают доступ к нашей базе проверенных поставщиков по всему СНГ.
            </p>
          </div>

          {/* Тарифные планы */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-dark-800 border-2 ${plan.color} rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'shadow-2xl shadow-primary-500/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Популярный
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-dark-300 text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="text-dark-400 text-lg ml-2">тенге{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {plan.buttonLink.startsWith('http') ? (
                    <a
                      href={plan.buttonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors block text-center ${
                        plan.popular
                          ? 'bg-primary-500 hover:bg-primary-600 text-white'
                          : 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
                      }`}
                    >
                      {plan.buttonText}
                    </a>
                  ) : (
                    <Link
                      to={plan.buttonLink}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors block text-center ${
                        plan.popular
                          ? 'bg-primary-500 hover:bg-primary-600 text-white'
                          : 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
                      }`}
                    >
                      {plan.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Дополнительная информация */}
          <div className="mb-16">
            <div className="card p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-semibold text-white mb-6">
                Часто задаваемые вопросы
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Есть ли скидки для годовой оплаты?</h4>
                  <p className="text-dark-300 text-sm">
                    Да, при оплате за год предоставляется скидка 20%. Свяжитесь с нами для получения специального предложения.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Какие способы оплаты доступны?</h4>
                  <p className="text-dark-300 text-sm">
                    Мы принимаем банковские переводы, карты Visa/MasterCard, а также мобильные платежи в Казахстане.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Призыв к действию */}
          <div className="text-center card p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
              ORBIZ.ASIA — платформа, где ваш бизнес находит друзей и партнёров для роста
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth/register" className="btn-primary px-8 py-3">
                Начать бесплатно
              </Link>
              <a
                href="https://wa.me/77776323616"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Получить консультацию
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;