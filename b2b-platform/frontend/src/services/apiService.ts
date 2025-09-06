import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Error response type
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Get API base URL from environment variables
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
    
    this.api = axios.create({
      baseURL,
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for adding auth tokens
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add timestamp for cache busting if needed
        if (config.method === 'get' && config.params) {
          config.params._t = Date.now();
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError<ApiErrorResponse>) => {
        // Handle different types of errors
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              // Unauthorized - clear token and redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              break;
              
            case 403:
              // Forbidden
              console.error('Access denied');
              break;
              
            case 404:
              // Not found
              console.error('Resource not found');
              break;
              
            case 429:
              // Too many requests
              console.error('Rate limit exceeded');
              break;
              
            case 500:
              // Server error
              console.error('Internal server error');
              break;
              
            default:
              console.error('API Error:', data?.message || 'Unknown error');
          }

          // Return structured error
          return Promise.reject({
            status,
            message: data?.message || data?.detail || 'An error occurred',
            errors: data?.errors,
          });
        } else if (error.request) {
          // Network error
          console.error('Network error:', error.message);
          return Promise.reject({
            status: 0,
            message: 'Network error. Please check your internet connection.',
            isNetworkError: true,
          });
        } else {
          // Something else
          console.error('Request error:', error.message);
          return Promise.reject({
            status: 0,
            message: error.message || 'Request failed',
          });
        }
      }
    );
  }

  // Generic GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  // Generic POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  // Generic PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  // Generic PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  // Generic DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  // Upload file
  async upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Download file
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.api.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  }

  // Get external API (bypassing interceptors for external services)
  async getExternal<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const externalApi = axios.create({
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });

    const response = await externalApi.get(url, config);
    return response.data;
  }

  // Set auth token
  setAuthToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  // Remove auth token
  removeAuthToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get current auth token
  getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Get API base URL
  getBaseURL(): string {
    return this.api.defaults.baseURL || '';
  }

  // Update API base URL
  setBaseURL(baseURL: string): void {
    this.api.defaults.baseURL = baseURL;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing or multiple instances
export { ApiService };

// Export default
export default apiService;