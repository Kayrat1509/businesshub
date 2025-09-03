import React from 'react';
import DiagnosticPage from './DiagnosticPage';

function App() {
  // Простая версия приложения для диагностики
  const showDiagnostic = new URLSearchParams(window.location.search).get('diagnostic') !== null;

  if (showDiagnostic) {
    return <DiagnosticPage />;
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4 text-gradient">
          🚀 B2B Platform
        </h1>
        <p className="text-xl text-dark-300 mb-8">
          Добро пожаловать в профессиональную B2B платформу
        </p>
        
        <div className="space-y-4">
          <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
            <h2 className="text-lg font-semibold mb-2 text-primary-400">
              ✅ Фронтенд работает!
            </h2>
            <p className="text-dark-300">
              React приложение успешно загружено и готово к работе
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
            <h3 className="text-md font-semibold mb-2 text-secondary-400">
              📍 Доступные сервисы:
            </h3>
            <ul className="text-left text-dark-300 space-y-1">
              <li>• Frontend: http://localhost:5174</li>
              <li>• Backend: http://localhost:8001/api</li>
              <li>• Swagger: http://localhost:8001/api/schema/swagger/</li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
            <h3 className="text-md font-semibold mb-2 text-yellow-400">
              👤 Тестовые аккаунты:
            </h3>
            <div className="text-left text-sm text-dark-300 space-y-2">
              <div>
                <strong>Админ:</strong> admin@example.com / Admin123!
              </div>
              <div>
                <strong>Поставщик:</strong> supplier@example.com / Supplier123!
              </div>
              <div>
                <strong>Соискатель:</strong> seeker@example.com / Seeker123!
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-x-4">
          <a 
            href="?diagnostic"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            🔧 Диагностика
          </a>
          <button 
            onClick={() => window.location.href = 'http://localhost:8001/api/schema/swagger/'}
            className="inline-block bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors"
          >
            📚 API Документация
          </button>
        </div>

        <div className="mt-6 text-sm text-dark-400">
          Если вы видите эту страницу, значит фронтенд работает корректно! 🎉
        </div>
      </div>
    </div>
  );
}

export default App;