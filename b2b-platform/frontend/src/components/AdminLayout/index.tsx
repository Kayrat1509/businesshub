import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const AdminLayout = () => {
  const { user } = useAppSelector(state => state.auth);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Admin Header */}
      <header className="bg-red-900 border-b border-red-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🛡️ Админ панель</h1>
          <div className="flex items-center space-x-4">
            <span className="text-red-100">Администратор: {user?.first_name || user?.username}</span>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;