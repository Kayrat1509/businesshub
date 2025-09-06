import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart, Building2, Users } from 'lucide-react';
import { Company } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleFavorite } from '../../store/slices/companiesSlice';
import { toast } from 'react-toastify';

interface CompanyCardProps {
  company: Company
}

const CompanyCard = ({ company }: CompanyCardProps) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);

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

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card p-6 hover:shadow-glow transition-all duration-300 group h-[250px] flex flex-col justify-between"
    >
      <Link to={`/company/${company.id}`} className="flex flex-col h-full">
        {/* Header with favorite button */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg truncate text-white group-hover:text-primary-400 transition-colors flex-1 pr-2">
            {company.name}
          </h3>
          <button
            onClick={handleToggleFavorite}
            className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
              company.is_favorite
                ? 'text-red-400 bg-red-500/20'
                : 'text-dark-400 hover:text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${company.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* City */}
        <p className="text-sm text-gray-600 mb-3 flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {company.city}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
          {company.description}
        </p>

        {/* Staff count */}
        {company.staff_count > 0 && (
          <p className="text-xs text-gray-700 mt-2 flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {company.staff_count} сотрудников
          </p>
        )}
      </Link>
    </motion.div>
  );
};

export default CompanyCard;