import { apiService } from './apiService';

export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  reset_token: string;
  password: string;
}

export interface SendCodeResponse {
  message: string;
}

export interface VerifyCodeResponse {
  reset_token: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const passwordResetService = {
  // Отправить код восстановления на email
  sendCode: async (data: SendCodeRequest): Promise<SendCodeResponse> => {
    const response = await apiService.post('/auth/password-reset/send-code/', data);
    return response.data;
  },

  // Проверить код и получить токен
  verifyCode: async (data: VerifyCodeRequest): Promise<VerifyCodeResponse> => {
    const response = await apiService.post('/auth/password-reset/verify-code/', data);
    return response.data;
  },

  // Сбросить пароль с токеном
  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await apiService.post('/auth/password-reset/reset/', data);
    return response.data;
  },
};

export default passwordResetService;