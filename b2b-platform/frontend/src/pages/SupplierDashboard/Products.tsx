import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Eye, Package } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchProducts } from '../../store/slices/productsSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const Products = () => {
  const dispatch = useAppDispatch()
  const { products, isLoading, totalCount } = useAppSelector(state => state.products)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [productType, setProductType] = useState<'all' | 'product' | 'service'>('all')

  useEffect(() => {
    dispatch(fetchProducts({ 
      filters: {
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        is_service: productType === 'service' ? true : productType === 'product' ? false : undefined,
      } 
    }))
  }, [dispatch, searchQuery, selectedCategory, productType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const formatPrice = (price?: number, currency: string = 'RUB') => {
    if (!price) return 'Цена не указана'
    const currencySymbol = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : '€'
    return `${price.toLocaleString()} ${currencySymbol}`
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Товары и услуги</h1>
          <p className="text-dark-300 mt-1">
            Управляйте каталогом вашей компании ({totalCount} позиций)
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Добавить позицию</span>
        </button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, описанию или артикулу..."
                className="input pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
          </form>

          {/* Type Filter */}
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value as typeof productType)}
            className="input w-auto"
          >
            <option value="all">Все типы</option>
            <option value="product">Товары</option>
            <option value="service">Услуги</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-auto"
          >
            <option value="">Все категории</option>
            {/* Categories would be loaded from state */}
          </select>

          <button className="btn-outline flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Фильтры</span>
          </button>
        </div>
      </motion.div>

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'Ничего не найдено' : 'Ваш каталог пуст'}
          </h3>
          <p className="text-dark-300 mb-6">
            {searchQuery 
              ? 'Попробуйте изменить критерии поиска'
              : 'Добавьте первый товар или услугу в ваш каталог'
            }
          </p>
          {!searchQuery && (
            <button className="btn-primary">
              Добавить первую позицию
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 hover:shadow-glow transition-all duration-300 group"
            >
              {/* Product Image */}
              <div className="relative mb-4">
                {product.primary_image ? (
                  <img
                    src={product.primary_image}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-dark-700 rounded-lg flex items-center justify-center">
                    <Package className="w-12 h-12 text-dark-400" />
                  </div>
                )}
                
                {/* Status badges */}
                <div className="absolute top-2 left-2 space-y-1">
                  {product.is_service && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                      Услуга
                    </span>
                  )}
                  {!product.in_stock && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                      Нет в наличии
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button className="p-2 bg-dark-800/80 rounded-lg text-blue-400 hover:text-blue-300">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-dark-800/80 rounded-lg text-green-400 hover:text-green-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-dark-800/80 rounded-lg text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white line-clamp-2 mb-1">
                    {product.title}
                  </h3>
                  {product.sku && (
                    <p className="text-dark-400 text-sm">Артикул: {product.sku}</p>
                  )}
                </div>

                <p className="text-dark-300 text-sm line-clamp-3">
                  {product.description}
                </p>

                {product.category && (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                    {product.category.name}
                  </span>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-dark-700">
                  <div className="text-lg font-bold text-white">
                    {formatPrice(product.price, product.currency)}
                  </div>
                  <div className={`text-sm ${product.in_stock ? 'text-green-400' : 'text-red-400'}`}>
                    {product.in_stock ? 'В наличии' : 'Нет в наличии'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products