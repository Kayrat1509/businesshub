import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout, refreshToken } from '../store/slices/authSlice';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Перехватчик запросов для автоматического добавления токена авторизации
    this.api.interceptors.request.use(
      (config) => {
        // Определяем публичные эндпоинты, которые не требуют авторизации
        const publicEndpoints = ['/auth/register/', '/auth/token/', '/auth/token/refresh/'];
        const publicGetEndpoints = ['/categories/', '/products/', '/tenders/']; // Только GET запросы к этим эндпоинтам публичны
        const privateEndpoints = ['/products/my/', '/tenders/my/']; // Эти endpoints всегда требуют авторизации
        
        // Проверяем, является ли endpoint приватным (всегда требует токен)
        const isPrivateEndpoint = privateEndpoints.some(endpoint => config.url?.includes(endpoint));
        
        // Проверяем, является ли endpoint публичным (не требует токен)
        const isPublicEndpoint = !isPrivateEndpoint && (
          publicEndpoints.some(endpoint => config.url?.includes(endpoint)) ||
          (config.method === 'get' && publicGetEndpoints.some(endpoint => config.url?.includes(endpoint)))
        );
        
        // Если endpoint не публичный, добавляем токен авторизации
        if (!isPublicEndpoint) {
          const state = store.getState();
          const token = state.auth.accessToken;
          
          // Добавляем Bearer токен в заголовки запроса
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Перехватчик ответов для автоматического обновления токенов при 401 ошибке
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Проверяем условия для автоматического обновления access токена:
        // 1. Получили 401 ошибку (Unauthorized - токен недействителен или истёк)
        // 2. Это не повторная попытка (флаг _retry предотвращает бесконечный цикл) 
        // 3. Это не сам запрос на обновление токена (избегаем рекурсии)
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          !originalRequest.url?.includes('/auth/token/refresh/')
        ) {
          originalRequest._retry = true; // Помечаем как повторный запрос

          try {
            const state = store.getState();
            const refreshTokenValue = state.auth.refreshToken;

            if (refreshTokenValue) {
              // Выполняем обновление токена через Redux action (асинхронно)
              const refreshResult = await store.dispatch(refreshToken(refreshTokenValue));
              
              // Проверяем, что обновление прошло успешно
              if (refreshToken.fulfilled.match(refreshResult)) {
                // Получаем новый access токен из результата action
                const newAccessToken = refreshResult.payload.access;
                
                // Обновляем заголовок Authorization для повторного запроса
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                
                // Повторяем оригинальный запрос с новым токеном
                return this.api(originalRequest);
              } else {
                // Если action вернул ошибку - выбрасываем её
                throw new Error('Token refresh action failed');
              }
            } else {
              // Если refresh токена нет - сразу выполняем logout
              throw new Error('No refresh token available');
            }
          } catch (refreshError) {
            // Если обновление токена не удалось - очищаем состояние и перенаправляем на login
            console.error('Автоматическое обновление токена не удалось:', refreshError);
            store.dispatch(logout());
            
            // Перенаправляем только если мы не на странице логина
            if (!window.location.pathname.includes('/auth/')) {
              window.location.href = '/auth/login';
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Универсальные методы HTTP запросов с автоматическим управлением токенами
  
  // GET запрос - получение данных с сервера (с параметрами запроса)
  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, { params });
    return response.data;
  }

  // POST запрос - создание новых ресурсов или выполнение действий
  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }

  // PUT запрос - полное обновление ресурса
  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }

  // PATCH запрос - частичное обновление ресурса
  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data);
    return response.data;
  }

  // DELETE запрос - удаление ресурса
  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }

  // Метод для загрузки файлов с дополнительными данными
  async uploadFile<T>(url: string, file: File, data?: any): Promise<T> {
    const formData = new FormData();
    formData.append('file', file); // Добавляем файл в FormData
    
    // Добавляем дополнительные поля если они переданы
    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
    }

    // Отправляем multipart/form-data запрос
    const response: AxiosResponse<T> = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

// Создаем единственный экземпляр API сервиса для всего приложения
// Этот экземпляр обеспечивает:
// 1. Автоматическое добавление Bearer токенов к приватным запросам
// 2. Автоматическое обновление токенов при 401 ошибке
// 3. Повтор неудачных запросов после обновления токена
// 4. Единообразную обработку HTTP запросов по всему приложению
export const apiService = new ApiService();
export default apiService;