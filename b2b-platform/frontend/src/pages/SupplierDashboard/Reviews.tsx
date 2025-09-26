import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Calendar, User, TrendingUp } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import apiService from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Review {
  id: number
  rating: number
  title: string
  content: string
  author_name: string
  created_at: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  product_name?: string
}

const Reviews = () => {
  const { user } = useAppSelector(state => state.auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    approvedReviews: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Simulate API call - replace with actual API
      const mockReviews: Review[] = [
        {
          id: 1,
          rating: 5,
          title: 'Отличное качество',
          content: 'Продукт полностью соответствует описанию. Быстрая доставка, качественная упаковка. Рекомендую!',
          author_name: 'Алексей К.',
          created_at: '2024-01-15T10:30:00Z',
          status: 'APPROVED',
          product_name: 'Смеситель для кухни',
        },
        {
          id: 2,
          rating: 4,
          title: 'Хороший сервис',
          content: 'Компания работает профессионально. Консультация была полезной.',
          author_name: 'Мария С.',
          created_at: '2024-01-14T15:20:00Z',
          status: 'APPROVED',
          product_name: 'Консультация по сантехнике',
        },
        {
          id: 3,
          rating: 5,
          title: 'Рекомендую всем',
          content: 'Уже второй раз покупаю у этой компании. Всегда довольна качеством и сервисом.',
          author_name: 'Светлана Р.',
          created_at: '2024-01-13T09:45:00Z',
          status: 'APPROVED',
          product_name: 'Унитаз напольный',
        },
        {
          id: 4,
          rating: 3,
          title: 'Есть замечания',
          content: 'В целом неплохо, но доставка задержалась на день.',
          author_name: 'Андрей В.',
          created_at: '2024-01-12T14:10:00Z',
          status: 'PENDING',
          product_name: 'Ванна акриловая',
        },
      ];
      
      setReviews(mockReviews);
      
      // Calculate stats
      const approved = mockReviews.filter(r => r.status === 'APPROVED');
      const pending = mockReviews.filter(r => r.status === 'PENDING');
      const avgRating = approved.length > 0 
        ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length 
        : 0;
      
      setStats({
        totalReviews: mockReviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
        approvedReviews: approved.length,
        pendingReviews: pending.length,
      });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      APPROVED: { text: 'Опубликован', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      REJECTED: { text: 'Отклонен', color: 'bg-red-500/20 text-red-400' },
    }[status];
    
    if (!config) {
return null;
}
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-dark-400'
            }`}
          />
        ))}
        <span className="text-sm text-dark-300 ml-2">{rating}/5</span>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Отзывы клиентов</h1>
          <p className="text-dark-300">Управление отзывами о ваших товарах и услугах</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Всего отзывов',
            value: stats.totalReviews,
            icon: MessageCircle,
            color: 'from-primary-600 to-primary-500',
          },
          {
            title: 'Средний рейтинг',
            value: `${stats.averageRating}/5`,
            icon: Star,
            color: 'from-yellow-600 to-yellow-500',
          },
          {
            title: 'Опубликованные',
            value: stats.approvedReviews,
            icon: TrendingUp,
            color: 'from-green-600 to-green-500',
          },
          {
            title: 'На модерации',
            value: stats.pendingReviews,
            icon: Calendar,
            color: 'from-orange-600 to-orange-500',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-dark-300 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Reviews List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-primary-400" />
          Последние отзывы
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Пока нет отзывов</h3>
            <p className="text-dark-300">
              Отзывы от клиентов будут отображаться здесь
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-dark-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{review.author_name}</p>
                      <p className="text-dark-400 text-sm">
                        {new Date(review.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(review.status)}
                  </div>
                </div>

                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>

                <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                <p className="text-dark-300 mb-3">{review.content}</p>

                {review.product_name && (
                  <div className="flex items-center text-sm text-dark-400">
                    <span className="mr-1">Продукт:</span>
                    <span className="text-primary-400">{review.product_name}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card p-6 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border border-primary-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400" />
          Как получить больше положительных отзывов
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark-300">
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Быстро отвечайте на запросы клиентов
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Предоставляйте качественные товары
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Соблюдайте сроки доставки
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
              Просите довольных клиентов оставить отзыв
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Reviews;