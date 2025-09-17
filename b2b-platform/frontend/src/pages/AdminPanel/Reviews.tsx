import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Building2,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api';

interface Review {
  id: number;
  author_name: string;
  author_email: string;
  company_name: string;
  rating: number;
  text: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_comment?: string;
  created_at: string;
}

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationComment, setModerationComment] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, statusFilter]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      // Загружаем отзывы на модерации
      const response = await apiService.get<Review[]>('/reviews/moderation/');
      setReviews(response);
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
      toast.error('Ошибка загрузки отзывов');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(review => review.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  const moderateReview = async (reviewId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiService.put(`/reviews/moderation/${reviewId}/`, {
        status,
        admin_comment: moderationComment
      });

      setReviews(reviews.map(review =>
        review.id === reviewId
          ? { ...review, status, admin_comment: moderationComment }
          : review
      ));

      toast.success(
        status === 'APPROVED'
          ? 'Отзыв одобрен'
          : 'Отзыв отклонен'
      );

      setSelectedReview(null);
      setModerationComment('');
    } catch (error) {
      console.error('Ошибка модерации отзыва:', error);
      toast.error('Ошибка модерации отзыва');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: 'text-yellow-400 bg-yellow-500/20',
        text: 'На модерации'
      },
      APPROVED: {
        icon: CheckCircle,
        color: 'text-green-400 bg-green-500/20',
        text: 'Одобрено'
      },
      REJECTED: {
        icon: XCircle,
        color: 'text-red-400 bg-red-500/20',
        text: 'Отклонено'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-dark-500'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Модерация отзывов</h1>
        <div className="flex items-center space-x-4">
          <span className="text-dark-300">
            Всего отзывов: {filteredReviews.length}
          </span>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по компании, автору или тексту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Filter className="text-dark-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="PENDING">На модерации</option>
              <option value="APPROVED">Одобренные</option>
              <option value="REJECTED">Отклоненные</option>
              <option value="ALL">Все статусы</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список отзывов */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="card p-8 text-center">
            <MessageSquare className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Отзывов не найдено</h3>
            <p className="text-dark-300">
              {statusFilter === 'PENDING'
                ? 'Нет отзывов, ожидающих модерации'
                : 'Нет отзывов с выбранными критериями'
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-dark-400" />
                    <span className="text-white font-medium">{review.author_name}</span>
                    <span className="text-dark-400 text-sm">({review.author_email})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-300">{review.company_name}</span>
                  </div>
                </div>
                {getStatusBadge(review.status)}
              </div>

              <div className="flex items-center space-x-4 mb-3">
                {renderStars(review.rating)}
                <div className="flex items-center space-x-2 text-dark-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(review.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-dark-200 leading-relaxed">{review.text}</p>
              </div>

              {review.admin_comment && (
                <div className="bg-dark-700 p-3 rounded-lg mb-4">
                  <p className="text-sm text-dark-300">
                    <strong>Комментарий модератора:</strong> {review.admin_comment}
                  </p>
                </div>
              )}

              {review.status === 'PENDING' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Модерировать
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Модальное окно модерации */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Модерация отзыва
            </h3>

            <div className="mb-4">
              <p className="text-dark-300 text-sm mb-2">
                <strong>Автор:</strong> {selectedReview.author_name}
              </p>
              <p className="text-dark-300 text-sm mb-2">
                <strong>Компания:</strong> {selectedReview.company_name}
              </p>
              <p className="text-dark-300 text-sm mb-2">
                <strong>Рейтинг:</strong> {selectedReview.rating}/5
              </p>
              <div className="bg-dark-700 p-3 rounded-lg">
                <p className="text-white text-sm">{selectedReview.text}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={moderationComment}
                onChange={(e) => setModerationComment(e.target.value)}
                placeholder="Укажите причину отклонения или дополнительную информацию..."
                className="input min-h-[80px]"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => moderateReview(selectedReview.id, 'APPROVED')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Одобрить</span>
              </button>
              <button
                onClick={() => moderateReview(selectedReview.id, 'REJECTED')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Отклонить</span>
              </button>
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setModerationComment('');
                }}
                className="btn-outline px-4 py-2"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
