import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setTestUser, logout } from './store/slices/authSlice';

const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  const handleSetTestUser = () => {
    dispatch(setTestUser());
    navigate('/dashboard');
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#0f172a', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      {/* Top-right link to home */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          НА ГЛАВНУЮ СТРАНИЦУ
        </button>
      </div>
      
      <h1 style={{ marginBottom: '20px', color: '#0ea5e9' }}>🔧 B2B Platform - Диагностика</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '10px' }}>✅ React приложение загружено успешно!</h2>
        <p>Если вы видите эту страницу, значит:</p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>✓ React работает корректно</li>
          <li>✓ TypeScript компилируется без ошибок</li>
          <li>✓ Vite сервер запущен</li>
          <li>✓ Основные компоненты доступны</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', color: '#14b8a6' }}>🌐 Информация о приложении:</h3>
        <p><strong>Frontend URL:</strong> {window.location.href}</p>
        <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'Не настроено'}</p>
        <p><strong>Режим:</strong> {import.meta.env.MODE}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', color: '#8b5cf6' }}>👤 Статус авторизации:</h3>
        <p><strong>Авторизован:</strong> {isAuthenticated ? 'Да' : 'Нет'}</p>
        {user && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#d1d5db' }}>
            <p><strong>Пользователь:</strong> {user.first_name} {user.last_name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Роль:</strong> {user.role}</p>
            <p><strong>ID компании:</strong> {user.company_id}</p>
          </div>
        )}
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={handleSetTestUser}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🧪 Установить тестового пользователя
          </button>
          
          <button 
            onClick={handleLogout}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🚪 Выйти
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            📊 Перейти в кабинет
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', color: '#f59e0b' }}>🚀 Следующие шаги:</h3>
        <p>Теперь можно переходить к основному приложению.</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          🏠 Перейти на главную страницу
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', color: '#ef4444' }}>🔍 Проблемы?</h3>
        <p>Если основное приложение не работает:</p>
        <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Проверьте консоль браузера (F12)</li>
          <li>Убедитесь что backend запущен на {import.meta.env.VITE_API_URL}</li>
          <li>Перезагрузите страницу</li>
        </ol>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          🔄 Перезагрузить страницу
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', color: '#8b5cf6' }}>👤 Тестовые аккаунты:</h3>
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '10px', padding: '8px', background: '#374151', borderRadius: '4px' }}>
            <strong>👑 Администратор:</strong><br/>
            Email: admin@example.com<br/>
            Пароль: Admin123!
          </div>
          <div style={{ marginBottom: '10px', padding: '8px', background: '#374151', borderRadius: '4px' }}>
            <strong>🏢 Поставщик:</strong><br/>
            Email: supplier@example.com<br/>
            Пароль: Supplier123!
          </div>
          <div style={{ marginBottom: '10px', padding: '8px', background: '#374151', borderRadius: '4px' }}>
            <strong>🔍 Соискатель:</strong><br/>
            Email: seeker@example.com<br/>
            Пароль: Seeker123!
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #374151' }}>
        <p style={{ color: '#9ca3af' }}>
          B2B Platform v1.0 | Создано с ❤️ используя React + TypeScript + Vite
        </p>
      </div>
    </div>
  );
};

export default DiagnosticPage;