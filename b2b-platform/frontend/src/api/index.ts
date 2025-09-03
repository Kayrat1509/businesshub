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
        // Skip auth token for public endpoints
        const publicEndpoints = ['/auth/register/', '/auth/token/', '/auth/token/refresh/', '/companies/', '/categories/', '/products/', '/tenders/'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
        
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

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const state = store.getState();
            const refreshTokenValue = state.auth.refreshToken;

            if (refreshTokenValue) {
              await store.dispatch(refreshToken(refreshTokenValue));
              return this.api(originalRequest);
            }
          } catch (refreshError) {
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