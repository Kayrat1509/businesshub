import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Star, Heart, Building2, Users } from 'lucide-react'
import { Company } from '../../types'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { toggleFavorite } from '../../store/slices/companiesSlice'
import { toast } from 'react-toastify'

interface CompanyCardProps {
  company: Company
}

const CompanyCard = ({ company }: CompanyCardProps) => {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector(state => state.auth)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.info('Войдите в систему, чтобы добавлять в избранное')
      return
    }

    try {
      await dispatch(toggleFavorite(company.id)).unwrap()
      toast.success(
        company.is_favorite 
          ? 'Удалено из избранного' 
          : 'Добавлено в избранное'
      )
    } catch (error) {
      toast.error('Ошибка при обновлении избранного')
    }
  }

  const getStatusBadge = () => {
    const statusConfig = {
      APPROVED: { text: 'Проверено', color: 'bg-green-500/20 text-green-400' },
      PENDING: { text: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400' },
      BANNED: { text: 'Заблокировано', color: 'bg-red-500/20 text-red-400' },
      DRAFT: { text: 'Черновик', color: 'bg-gray-500/20 text-gray-400' },
    }
    
    const config = statusConfig[company.status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

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

        {/* Stats */}
        <div className="flex justify-between items-center pt-4 border-t border-dark-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white font-medium">{company.rating.toFixed(1)}</span>
              {company.reviews_count !== undefined && (
                <span className="text-dark-400 text-sm">({company.reviews_count})</span>
              )}
            </div>
            
            {company.staff_count > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-dark-400" />
                <span className="text-dark-300 text-sm">{company.staff_count}</span>
              </div>
            )}
          </div>

          {getStatusBadge()}
        </div>
      </Link>
    </motion.div>
  )
}

export default CompanyCard