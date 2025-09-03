import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#0f172a', 
          color: 'white', 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <h1 style={{ marginBottom: '20px' }}>⚠️ Что-то пошло не так</h1>
          <p style={{ marginBottom: '20px' }}>Приложение столкнулось с ошибкой:</p>
          <pre style={{ background: '#1e293b', padding: '10px', borderRadius: '5px' }}>
            {this.state.error?.message || 'Неизвестная ошибка'}
          </pre>
          <button 
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              background: '#0ea5e9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <BrowserRouter>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  rootElement.innerHTML = `
    <div style="
      padding: 20px; 
      background: #0f172a; 
      color: white; 
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: Inter, sans-serif;
    ">
      <h1 style="margin-bottom: 20px;">🚨 Ошибка загрузки приложения</h1>
      <p style="margin-bottom: 20px;">Не удалось запустить React приложение.</p>
      <pre style="background: #1e293b; padding: 10px; border-radius: 5px;">
        ${error?.toString() || 'Неизвестная ошибка'}
      </pre>
      <button 
        onclick="window.location.reload()"
        style="
          margin-top: 20px; 
          padding: 10px 20px; 
          background: #0ea5e9; 
          color: white; 
          border: none; 
          border-radius: 5px;
          cursor: pointer;
        "
      >
        Перезагрузить страницу
      </button>
    </div>
  `;
}