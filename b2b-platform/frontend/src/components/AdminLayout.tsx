import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Админ-панель</h1>
          <Link 
            to="/" 
            className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
          >
            НА ГЛАВНУЮ СТРАНИЦУ
          </Link>
        </div>
      </header>
      
      {/* Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;