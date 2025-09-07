import { apiService } from '../api';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  role: 'ROLE_SEEKER' | 'ROLE_SUPPLIER';
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

class AuthService {
  private readonly BASE_URL = '/api/auth';

  // Login - вход пользователя в систему
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(`${this.BASE_URL}/token/`, credentials);
    
    if (response.access) {
      // Сохраняем токены в localStorage для дальнейшего использования
      this.setTokens(response.access, response.refresh);
    }
    
    return response;
  }

  // Register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(`${this.BASE_URL}/register/`, data);
    
    if (response.access) {
      this.setTokens(response.access, response.refresh);
    }
    
    return response;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiService.post(`${this.BASE_URL}/token/blacklist/`, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Refresh token - обновление access токена используя refresh токен
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Отправляем POST запрос для обновления токена с refresh токеном в теле запроса
      const response = await apiService.post<AuthResponse>(`${this.BASE_URL}/token/refresh/`, {
        refresh: refreshToken
      });
      
      if (response.access) {
        // Обновляем сохраненные токены новыми значениями
        this.setTokens(response.access, response.refresh || refreshToken);
      }
      
      return response;
    } catch (error) {
      // В случае ошибки очищаем все токены (токен истек или недействителен)
      this.clearTokens();
      throw error;
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    return apiService.get<User>(`${this.BASE_URL}/profile/`);
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiService.patch<User>(`${this.BASE_URL}/profile/`, data);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`${this.BASE_URL}/change-password/`, data);
  }

  // Reset password request
  async requestPasswordReset(data: ResetPasswordRequest): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`${this.BASE_URL}/reset-password/`, data);
  }

  // Confirm password reset
  async confirmPasswordReset(data: ConfirmResetPasswordRequest): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`${this.BASE_URL}/reset-password/confirm/`, data);
  }

  // Email verification
  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`${this.BASE_URL}/verify-email/`, { token });
  }

  // Resend email verification
  async resendEmailVerification(): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`${this.BASE_URL}/resend-verification/`);
  }

  // Token management helpers - вспомогательные методы для работы с токенами
  private setTokens(accessToken: string, refreshToken: string): void {
    // Сохраняем токены в localStorage для постоянного хранения
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens(): void {
    // Полностью очищаем все токены из localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Get current access token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Get current refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Check if token is expired (basic check)
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    
    if (!tokenToCheck) return true;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  // Auto refresh token if needed
  async ensureValidToken(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) return null;

    if (this.isTokenExpired(accessToken)) {
      try {
        const response = await this.refreshToken();
        return response.access;
      } catch {
        return null;
      }
    }

    return accessToken;
  }

  // Initialize auth state (call on app startup)
  async initialize(): Promise<User | null> {
    try {
      const token = await this.ensureValidToken();
      
      if (!token) return null;

      const user = await this.getProfile();
      return user;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.clearTokens();
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;