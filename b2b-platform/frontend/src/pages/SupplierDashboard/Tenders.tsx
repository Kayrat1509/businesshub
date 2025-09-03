import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Calendar, Clock, Check, X, AlertCircle,
  Filter, SortAsc, SortDesc 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyTenders } from '../../store/slices/tendersSlice';
import TenderCard from '../../components/TenderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Tender } from '../../types';

type TenderStatus = 'all' | 'active' | 'expired' | 'pending' | 'rejected';
type SortBy = 'created_at' | 'deadline_date' | 'title';
type SortOrder = 'asc' | 'desc';

const MyTenders = () => {
  const dispatch = useAppDispatch();
  const { tenders, isLoading } = useAppSelector(state => state.tenders);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [statusFilter, setStatusFilter] = useState<TenderStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    dispatch(fetchMyTenders({ page: 1, filters: {} }));
  }, [dispatch]);

  useEffect(() => {
    let filtered = [...tenders];

    // Filter by status
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter(tender => {
          if (!tender.deadline_date) return true;
          return new Date(tender.deadline_date) >= new Date() && tender.status === 'APPROVED';
        });
        break;
      case 'expired':
        filtered = filtered.filter(tender => {
          if (!tender.deadline_date) return false;
          return new Date(tender.deadline_date) < new Date();
        });
        break;
      case 'pending':
        filtered = filtered.filter(tender => tender.status === 'PENDING');
        break;
      case 'rejected':
        filtered = filtered.filter(tender => tender.status === 'REJECTED');
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'deadline_date':
          aValue = a.deadline_date ? new Date(a.deadline_date) : new Date('9999-12-31');
          bValue = b.deadline_date ? new Date(b.deadline_date) : new Date('9999-12-31');
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTenders(filtered);
  }, [tenders, statusFilter, sortBy, sortOrder]);

  const getStatusConfig = () => {
    return [
      { key: 'all', label: 'Все тендеры', count: tenders.length },
      { 
        key: 'active', 
        label: 'Действующие', 
        count: tenders.filter(t => 
          (!t.deadline_date || new Date(t.deadline_date) >= new Date()) && t.status === 'APPROVED'
        ).length 
      },
      { 
        key: 'expired', 
        label: 'Истекшие', 
        count: tenders.filter(t => 
          t.deadline_date && new Date(t.deadline_date) < new Date()
        ).length 
      },
      { 
        key: 'pending', 
        label: 'На модерации', 
        count: tenders.filter(t => t.status === 'PENDING').length 
      },
      { 
        key: 'rejected', 
        label: 'Отклоненные', 
        count: tenders.filter(t => t.status === 'REJECTED').length 
      },
    ];
  };

  const getStatusIcon = (status: TenderStatus) => {
    switch (status) {
      case 'active': return <Check className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Мои тендеры</h1>
          <p className="text-dark-300">Управление вашими тендерами</p>
        </div>
        <Link 
          to="/dashboard/tenders/create"
          className="btn-primary flex items-center space-x-2 mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>Создать тендер</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {getStatusConfig().map((status) => (
            <button
              key={status.key}
              onClick={() => setStatusFilter(status.key as TenderStatus)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                statusFilter === status.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
              }`}
            >
              {getStatusIcon(status.key as TenderStatus)}
              <span>{status.label}</span>
              <span className="bg-dark-600 text-dark-300 px-2 py-1 rounded text-xs">
                {status.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-dark-700">
          <div className="flex items-center space-x-2 text-dark-300">
            <Filter className="w-4 h-4" />
            <span>Сортировать по:</span>
          </div>
          
          <button
            onClick={() => handleSort('created_at')}
            className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
              sortBy === 'created_at' ? 'text-primary-400' : 'text-dark-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Дате создания</span>
            {sortBy === 'created_at' && (
              sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
            )}
          </button>
          
          <button
            onClick={() => handleSort('deadline_date')}
            className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
              sortBy === 'deadline_date' ? 'text-primary-400' : 'text-dark-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Дедлайну</span>
            {sortBy === 'deadline_date' && (
              sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
            )}
          </button>
          
          <button
            onClick={() => handleSort('title')}
            className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
              sortBy === 'title' ? 'text-primary-400' : 'text-dark-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Названию</span>
            {sortBy === 'title' && (
              sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Tenders Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredTenders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {statusFilter === 'all' ? 'Нет тендеров' : `Нет тендеров в категории "${getStatusConfig().find(s => s.key === statusFilter)?.label}"`}
          </h3>
          <p className="text-dark-300 mb-6">
            {statusFilter === 'all' 
              ? 'Создайте ваш первый тендер, чтобы начать поиск поставщиков' 
              : 'Попробуйте выбрать другую категорию'
            }
          </p>
          {statusFilter === 'all' && (
            <Link to="/dashboard/tenders/create" className="btn-primary">
              Создать тендер
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTenders.map((tender, index) => (
            <motion.div
              key={tender.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <TenderCard tender={tender} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Статистика тендеров</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getStatusConfig().slice(1).map((status) => (
            <div key={status.key} className="text-center p-4 bg-dark-700 rounded-lg">
              <div className="flex justify-center mb-2">
                {getStatusIcon(status.key as TenderStatus)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{status.count}</div>
              <div className="text-dark-300 text-sm">{status.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MyTenders;