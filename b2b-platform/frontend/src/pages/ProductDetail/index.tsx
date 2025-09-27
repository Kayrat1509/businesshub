import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Star,
  Phone,
  Mail,
  Globe,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import PriceDisplay from '../../components/PriceDisplay';
import { toast } from 'react-hot-toast';
import apiService from '../../api';

interface Product {
  id: number;
  title: string;
  description: string;
  price?: number;
  currency: string;
  is_service: boolean;
  category?: {
    id: number;
    name: string;
  };
  image?: string;
  rating?: number;
  in_stock: boolean;
  created_at: string;
  company: {
    id: number;
    name: string;
    city: string;
    address?: string;
    contacts?: {
      phone?: string;
      phones?: string[];
      email?: string;
      emails?: string[];
      website?: string;
    };
    rating?: number;
    logo?: string;
  };
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(Number(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      setIsLoading(true);
      // Загружаем товар с информацией о компании
      const response = await apiService.get<Product>(`/products/${productId}/`);
      setProduct(response);
    } catch (error: any) {
      console.error('Ошибка загрузки товара:', error);
      if (error?.response?.status === 404) {
        toast.error('Продукт не найден');
        navigate('/');
      } else {
        toast.error('Ошибка загрузки товара');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallCompany = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmailCompany = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Продукт не найден</h1>
          <Link to="/" className="btn-primary px-6 py-3">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  // Функция для получения всех телефонов компании
  const getAllPhones = () => {
    const phones: string[] = [];

    // Добавляем одинарный телефон, если есть
    if (product?.company.contacts?.phone) {
      phones.push(product.company.contacts.phone);
    }

    // Добавляем массив телефонов, если есть
    if (product?.company.contacts?.phones && Array.isArray(product.company.contacts.phones)) {
      product.company.contacts.phones.forEach(phone => {
        if (phone && !phones.includes(phone)) { // Избегаем дублирования
          phones.push(phone);
        }
      });
    }

    return phones;
  };

  // Функция для получения всех email адресов компании
  const getAllEmails = () => {
    const emails: string[] = [];

    // Добавляем одинарный email, если есть
    if (product?.company.contacts?.email) {
      emails.push(product.company.contacts.email);
    }

    // Добавляем массив emails, если есть
    if (product?.company.contacts?.emails && Array.isArray(product.company.contacts.emails)) {
      product.company.contacts.emails.forEach(email => {
        if (email && !emails.includes(email)) { // Избегаем дублирования
          emails.push(email);
        }
      });
    }

    return emails;
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-dark-300 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад</span>
      </button>

      {/* Первый ряд: Фото товара и описание */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Левая колонка: Изображение товара и контакты поставщика */}
        <div className="flex-shrink-0 space-y-6 w-full max-w-md lg:max-w-lg">
          {/* Изображение товара */}
          <div className="card p-6">
            <div className="w-full h-[400px] bg-dark-700 rounded-lg overflow-hidden">
              {product.image && !imageError ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-dark-500" />
                </div>
              )}
            </div>
          </div>

          {/* Контактные данные поставщика */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Поставщик: <Link
                to={`/company/${product.company.id}`}
                className="text-primary-400 hover:text-primary-300 transition-colors underline"
              >
                {product.company.name}
              </Link>
            </h3>

            <div className="space-y-3">
              {/* Все телефоны */}
              {getAllPhones().length > 0 ? (
                getAllPhones().map((phone, index) => (
                  <button
                    key={index}
                    onClick={() => handleCallCompany(phone)}
                    className={`w-full flex items-center ${index === 0 ? 'justify-center' : ''} space-x-3 p-3 ${
                      index === 0
                        ? 'bg-green-600 hover:bg-green-700 font-medium'
                        : 'bg-dark-700 hover:bg-dark-600'
                    } rounded-lg transition-colors text-white`}
                  >
                    <Phone className={`w-${index === 0 ? '5' : '4'} h-${index === 0 ? '5' : '4'} ${index === 0 ? '' : 'text-primary-400'}`} />
                    <span>{index === 0 ? `Позвонить: ${phone}` : phone}</span>
                  </button>
                ))
              ) : null}

              {/* Все email адреса */}
              {getAllEmails().length > 0 && (
                getAllEmails().map((email, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmailCompany(email)}
                    className="w-full flex items-center space-x-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-white"
                  >
                    <Mail className="w-4 h-4 text-primary-400" />
                    <span>{email}</span>
                  </button>
                ))
              )}

              {/* Веб-сайт */}
              {product.company.contacts?.website && (
                <a
                  href={product.company.contacts.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-white"
                >
                  <Globe className="w-4 h-4 text-primary-400" />
                  <span>Веб-сайт</span>
                  <ExternalLink className="w-3 h-3 text-dark-400 ml-auto" />
                </a>
              )}

              {getAllPhones().length === 0 && getAllEmails().length === 0 && !product.company.contacts?.website && (
                <div className="text-center py-4 text-dark-400">
                  Контакты не указаны
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Описание товара */}
        <div className="flex-1 card p-6">
          {/* Заголовок и категория */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                product.is_service
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {product.is_service ? 'Услуга' : 'Продукт'}
              </span>

              {!product.is_service && (
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  product.in_stock
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {product.in_stock ? 'В наличии' : 'Нет в наличии'}
                </span>
              )}

              {product.category && (
                <span className="px-3 py-1 text-sm bg-primary-500/20 text-primary-400 rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white">{product.title}</h1>

            {/* Цена */}
            <div className="flex items-center space-x-4">
              {product.price ? (
                <PriceDisplay
                  price={product.price}
                  currency={product.currency}
                  className="text-2xl font-bold"
                />
              ) : (
                <span className="text-2xl font-bold text-dark-300">Договорная</span>
              )}

              {product.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-white font-medium">{product.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Описание */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Описание</h3>
            <div className="text-dark-200 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;