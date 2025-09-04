import { apiService } from './apiService';
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
  private readonly BASE_URL = '/auth';

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(`${this.BASE_URL}/login/`, credentials);
    
    if (response.access) {
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
        await apiService.post(`${this.BASE_URL}/logout/`, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post<AuthResponse>(`${this.BASE_URL}/refresh/`, {
        refresh: refreshToken
      });
      
      if (response.access) {
        this.setTokens(response.access, response.refresh || refreshToken);
      }
      
      return response;
    } catch (error) {
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

  // Token management helpers
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    apiService.setAuthToken(accessToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    apiService.removeAuthToken();
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