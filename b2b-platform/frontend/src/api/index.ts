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
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Skip auth token for public endpoints - only GET requests to these endpoints are public
        const publicEndpoints = ['/auth/register/', '/auth/token/', '/auth/token/refresh/'];
        const publicGetEndpoints = ['/categories/', '/products/', '/tenders/'];
        const privateEndpoints = ['/products/my/']; // Эти endpoints всегда требуют авторизацию
        
        const isPrivateEndpoint = privateEndpoints.some(endpoint => config.url?.includes(endpoint));
        const isPublicEndpoint = !isPrivateEndpoint && (
          publicEndpoints.some(endpoint => config.url?.includes(endpoint)) ||
          (config.method === 'get' && publicGetEndpoints.some(endpoint => config.url?.includes(endpoint)))
        );
        
        if (!isPublicEndpoint) {
          const state = store.getState();
          const token = state.auth.accessToken;
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle token refresh - перехватчик для автоматического обновления токенов
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Проверяем условия для обновления токена:
        // 1. Получили 401 ошибку (неавторизован)
        // 2. Это не повторная попытка (избегаем бесконечного цикла) 
        // 3. Это не сам запрос на обновление токена (важно!)
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          !originalRequest.url?.includes('/auth/token/refresh/')
        ) {
          originalRequest._retry = true;

          try {
            const state = store.getState();
            const refreshTokenValue = state.auth.refreshToken;

            if (refreshTokenValue) {
              // Обновляем токен через Redux action
              await store.dispatch(refreshToken(refreshTokenValue));
              
              // Получаем обновленный токен из store
              const newState = store.getState();
              if (newState.auth.accessToken) {
                // Обновляем заголовок Authorization в оригинальном запросе
                originalRequest.headers.Authorization = `Bearer ${newState.auth.accessToken}`;
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            // Если обновление токена не удалось - выполняем logout
            console.error('Token refresh failed:', refreshError);
            store.dispatch(logout());
            window.location.href = '/auth/login';
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }

  // File upload method
  async uploadFile<T>(url: string, file: File, data?: any): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
    }

    const response: AxiosResponse<T> = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;