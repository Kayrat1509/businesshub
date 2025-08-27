import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Users, Award, ArrowRight, Building2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchCategories, fetchCategoryTree } from '../../store/slices/categoriesSlice'
import { fetchCompanies } from '../../store/slices/companiesSlice'
import { fetchTenders } from '../../store/slices/tendersSlice'
import CompanyCard from '../../components/CompanyCard'
import CategoryGrid from '../../components/CategoryGrid'
import TenderCard from '../../components/TenderCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchQuery, setSearchQuery] = useState('')
  
  const { categoryTree } = useAppSelector(state => state.categories)
  const { companies, isLoading: companiesLoading } = useAppSelector(state => state.companies)
  const { tenders } = useAppSelector(state => state.tenders)

  useEffect(() => {
    // Fetch data for homepage
    dispatch(fetchCategoryTree())
    dispatch(fetchCompanies({ page: 1, filters: { is_popular: true } }))
    dispatch(fetchTenders({ page: 1, filters: { status: 'APPROVED' } }))
  }, [dispatch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const stats = [
    { icon: Building2, label: 'Компаний', value: '10,000+', color: 'text-primary-400' },
    { icon: Users, label: 'Пользователей', value: '50,000+', color: 'text-secondary-400' },
    { icon: TrendingUp, label: 'Сделок', value: '100,000+', color: 'text-green-400' },
    { icon: Award, label: 'Категорий', value: '500+', color: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient leading-tight">
              Найдите своего
              <br />
              идеального поставщика
            </h1>
            <p className="text-xl md:text-2xl text-dark-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Профессиональная B2B платформа для поиска надежных поставщиков товаров и услуг. 
              Более 10,000 проверенных компаний ждут вас.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Поиск компаний, товаров, услуг..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 input pl-12 pr-4 py-4 text-lg rounded-l-xl border-r-0 focus:border-primary-500 focus:ring-primary-500 bg-dark-700/50 backdrop-blur"
                  />
                  <button 
                    type="submit"
                    className="btn-primary px-8 py-4 text-lg rounded-r-xl hover:shadow-glow transition-all duration-300"
                  >
                    <Search className="w-6 h-6" />
                  </button>
                </div>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              </form>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link to="/search" className="btn-outline px-6 py-3 hover:shadow-glow">
                Все компании
              </Link>
              <Link to="/tenders" className="btn-ghost px-6 py-3 hover:bg-dark-700">
                Тендеры
              </Link>
              <Link to="/auth/register" className="btn-secondary px-6 py-3 hover:shadow-glow">
                Стать поставщиком
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-dark-800/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-dark-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Популярные категории
            </h2>
            <p className="text-xl text-dark-300">
              Найдите поставщиков в нужной вам отрасли
            </p>
          </motion.div>

          <CategoryGrid categories={categoryTree.slice(0, 8)} />
        </div>
      </section>

      {/* Popular Companies Section */}
      <section className="py-20 px-4 bg-dark-800/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Популярные компании
              </h2>
              <p className="text-xl text-dark-300">
                Проверенные поставщики с высоким рейтингом
              </p>
            </div>
            <Link 
              to="/search?is_popular=true" 
              className="btn-outline flex items-center space-x-2 hover:shadow-glow"
            >
              <span>Смотреть все</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {companiesLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.slice(0, 6).map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <CompanyCard company={company} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tenders Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Актуальные тендеры
              </h2>
              <p className="text-xl text-dark-300">
                Новые возможности для вашего бизнеса
              </p>
            </div>
            <Link 
              to="/tenders" 
              className="btn-outline flex items-center space-x-2 hover:shadow-glow"
            >
              <span>Все тендеры</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenders.slice(0, 4).map((tender, index) => (
              <motion.div
                key={tender.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <TenderCard tender={tender} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Готовы развивать свой бизнес?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Присоединяйтесь к тысячам успешных компаний на нашей платформе
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/auth/register" 
                className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Зарегистрироваться как поставщик
              </Link>
              <Link 
                to="/search" 
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold"
              >
                Найти поставщиков
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home