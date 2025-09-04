import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart, Building2, Users, Package } from 'lucide-react';
import { Company, Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleFavorite } from '../../store/slices/companiesSlice';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { currencyService } from '../../services/currencyService';

interface CompanyCardProps {
  company: Company
}

const CompanyCard = ({ company }: CompanyCardProps) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const [selectedCurrency, setSelectedCurrency] = useState<'KZT' | 'RUB' | 'USD'>('KZT');

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info('Войдите в систему, чтобы добавлять в избранное');
      return;
    }

    try {
      await dispatch(toggleFavorite(company.id)).unwrap();
      toast.success(
        company.is_favorite 
          ? 'Удалено из избранного' 
          : 'Добавлено в избранное',
      );
    } catch (error) {
      toast.error('Ошибка при обновлении избранного');
    }
  };

  const [convertedPrices, setConvertedPrices] = useState<{[key: string]: number}>({});
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const convertPrices = async () => {
      if (!company.products || company.products.length === 0) return;
      
      setIsConverting(true);
      const newConvertedPrices: {[key: string]: number} = {};
      
      try {
        for (const product of company.products) {
          if (product.price && product.currency) {
            const convertedPrice = await currencyService.convertPrice(
              product.price,
              product.currency,
              selectedCurrency
            );
            newConvertedPrices[product.id.toString()] = convertedPrice;
          }
        }
        setConvertedPrices(newConvertedPrices);
      } catch (error) {
        console.error('Error converting prices:', error);
      } finally {
        setIsConverting(false);
      }
    };

    convertPrices();
  }, [selectedCurrency, company.products]);

  const formatPrice = (product: Product) => {
    if (!product.price) return 'Договорная';
    
    const convertedPrice = convertedPrices[product.id.toString()];
    if (convertedPrice !== undefined) {
      return `${convertedPrice.toLocaleString()} ${selectedCurrency}`;
    }
    
    // Show original price while converting
    return `${product.price.toLocaleString()} ${product.currency}`;
  };

  const truncateDescription = (text: string, maxLines: number = 4) => {
    const maxChars = maxLines * 50; // Approx 50 chars per line
    return text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
  };

  const getStatusBadge = () => {
    const statusConfig = {
      APPROVED: { text: 'Проверено', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      BANNED: { text: 'Заблокировано', color: 'bg-red-500/20 text-red-400' },
      DRAFT: { text: 'Черновик', color: 'bg-gray-500/20 text-gray-400' },
    };
    
    const config = statusConfig[company.status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card p-6 hover:shadow-glow transition-all duration-300 group"
    >
      <Link to={`/company/${company.id}`} className="block">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-dark-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-dark-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                {company.name}
              </h3>
              <p className="text-dark-300 text-sm flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {company.city}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
              company.is_favorite
                ? 'text-red-400 bg-red-500/20'
                : 'text-dark-400 hover:text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Heart className={`w-5 h-5 ${company.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-dark-300 text-sm mb-4 line-clamp-3">
          {company.description}
        </p>

        {/* Categories */}
        {company.categories && company.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {company.categories.slice(0, 3).map((category) => (
              <span
                key={category.id}
                className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300"
              >
                {category.name}
              </span>
            ))}
            {company.categories.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-dark-600 text-dark-300">
                +{company.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Currency Selector */}
        <div className="mb-4">
          <select
            value={selectedCurrency}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedCurrency(e.target.value as 'KZT' | 'RUB' | 'USD');
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="bg-dark-600 border border-dark-500 rounded px-2 py-1 text-sm text-white"
          >
            <option value="KZT">KZT</option>
            <option value="RUB">RUB</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {/* Products */}
        {company.products && company.products.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Товары и услуги
            </h4>
            <div className="space-y-2">
              {company.products.slice(0, 3).map((product) => (
                <div key={product.id} className="bg-dark-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-white text-sm font-medium truncate flex-1 mr-2">
                      {product.title}
                    </h5>
                    <span className="text-primary-400 text-sm font-medium whitespace-nowrap">
                      {isConverting ? (
                        <span className="text-dark-400">...</span>
                      ) : (
                        formatPrice(product)
                      )}
                    </span>
                  </div>
                  <p className="text-dark-300 text-xs line-clamp-2">
                    {truncateDescription(product.description)}
                  </p>
                </div>
              ))}
              {company.products.length > 3 && (
                <div className="text-center">
                  <span className="text-dark-400 text-xs">
                    +{company.products.length - 3} товаров
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-between items-center pt-4 border-t border-dark-700">
          <div className="flex items-center space-x-4">
            {company.staff_count > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-dark-400" />
                <span className="text-dark-300 text-sm">{company.staff_count} сотрудников</span>
              </div>
            )}
          </div>

          {getStatusBadge()}
        </div>
      </Link>
    </motion.div>
  );
};

export default CompanyCard;