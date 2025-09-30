import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Plus, X, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Product {
  id: number;
  title: string;
  price: number;
  currency: string;
  image: string;
  category: { name: string } | string;
  on_sale: boolean;
}

interface Action {
  id: number;
  title: string;
  description: string;
  products_count: number;
}

const ManageActionProducts: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [action, setAction] = useState<Action | null>(null);
  const [actionProducts, setActionProducts] = useState<Product[]>([]);
  const [allUserProducts, setAllUserProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) {
      toast.error('ID акции не найден');
      navigate('/dashboard/actions');
      return;
    }

    try {
      setIsLoading(true);

      // Загружаем информацию об акции
      const actionData = await apiService.get(`/ads/actions/${id}/`);
      setAction(actionData);

      // Загружаем товары в акции
      const actionProductsData = await apiService.get(`/ads/actions/${id}/products/`);
      setActionProducts(actionProductsData.products || []);

      // Загружаем все товары пользователя
      const allProductsData = await apiService.get<{ results: Product[] }>('/products/my/');
      setAllUserProducts(allProductsData.results || []);

    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  // Добавить товар в акцию
  const handleAddProduct = async (productId: number) => {
    try {
      setIsAdding(true);
      await apiService.post(`/ads/actions/${id}/add-products/`, {
        product_ids: [productId]
      });

      toast.success('Товар добавлен в акцию!');
      loadData();
    } catch (error: any) {
      console.error('Ошибка добавления товара:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при добавлении товара в акцию';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  // Удалить товар из акции
  const handleRemoveProduct = async (productId: number) => {
    try {
      setIsRemoving(productId);
      await apiService.post(`/ads/actions/${id}/remove-products/`, {
        product_ids: [productId]
      });

      toast.success('Товар удален из акции!');
      loadData();
    } catch (error: any) {
      console.error('Ошибка удаления товара:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.detail ||
                          'Ошибка при удалении товара из акции';
      toast.error(errorMessage);
    } finally {
      setIsRemoving(null);
    }
  };

  // Фильтруем товары: оставляем только те, которых нет в акции
  const availableProducts = allUserProducts.filter(
    (product) => !actionProducts.some((ap) => ap.id === product.id)
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!action) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-300">Акция не найдена</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard/actions')}
            className="flex items-center text-dark-300 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Package className="w-8 h-8 mr-3 text-purple-400" />
              Управление товарами в акции
            </h1>
            <p className="text-dark-300 text-lg mt-2">
              {action.title}
            </p>
          </div>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
          <p className="text-purple-300">
            <strong>Товаров в акции:</strong> {actionProducts.length}
          </p>
          <p className="text-purple-200 text-sm mt-1">
            {action.description}
          </p>
        </div>
      </motion.div>

      {/* Товары в акции */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">
          Товары в акции ({actionProducts.length})
        </h2>

        {actionProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionProducts.map((product) => (
              <div
                key={product.id}
                className="border border-dark-700 rounded-lg p-4 hover:border-dark-600 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-dark-700 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-dark-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">
                      {product.title}
                    </h3>
                    <p className="text-dark-400 text-sm mb-2">
                      {typeof product.category === 'object' ? product.category.name : product.category || 'Без категории'}
                    </p>
                    <p className="text-primary-400 font-semibold">
                      {product.price
                        ? `${product.currency === 'USD' ? '$' : product.currency === 'RUB' ? '₽' : '₸'}${product.price.toLocaleString()}`
                        : 'Договорная'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  disabled={isRemoving === product.id}
                  className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                >
                  {isRemoving === product.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      Убрать из акции
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <p className="text-dark-300">В акции пока нет товаров</p>
          </div>
        )}
      </motion.div>

      {/* Доступные товары для добавления */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">
          Доступные товары ({availableProducts.length})
        </h2>

        {availableProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProducts.map((product) => (
              <div
                key={product.id}
                className="border border-dark-700 rounded-lg p-4 hover:border-dark-600 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-dark-700 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-dark-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">
                      {product.title}
                    </h3>
                    <p className="text-dark-400 text-sm mb-2">
                      {typeof product.category === 'object' ? product.category.name : product.category || 'Без категории'}
                    </p>
                    <p className="text-primary-400 font-semibold">
                      {product.price
                        ? `${product.currency === 'USD' ? '$' : product.currency === 'RUB' ? '₽' : '₸'}${product.price.toLocaleString()}`
                        : 'Договорная'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddProduct(product.id)}
                  disabled={isAdding}
                  className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors text-sm"
                >
                  {isAdding ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить в акцию
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <p className="text-dark-300">
              {allUserProducts.length === 0
                ? 'У вас нет товаров'
                : 'Все ваши товары уже добавлены в эту акцию'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageActionProducts;
