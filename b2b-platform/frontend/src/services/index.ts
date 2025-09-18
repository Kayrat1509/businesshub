// Main services export file - все сервисы используют единый API слой
export { apiService, ApiService } from './apiService';
export { currencyService } from './currencyService';
export { productService } from './productService';
export { companyService } from './companyService';
export { authService } from './authService';
export { tenderService } from './tenderService'; // Новый сервис для работы с тендерами
export { passwordResetService } from './passwordReset';

// Types
export type { 
  ApiResponse, 
  PaginatedApiResponse, 
  ApiErrorResponse 
} from './apiService';

export type {
  ExchangeRates,
  ExchangeRateResponse,
  ConvertPriceRequest,
  ConvertPriceResponse
} from './currencyService';

export type {
  CreateProductRequest,
  UpdateProductRequest,
  ProductsResponse
} from './productService';

export type {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompaniesResponse,
  FavoriteCompanyResponse
} from './companyService';

export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest
} from './authService';

export type {
  CreateTenderRequest,
  UpdateTenderRequest,
  TendersResponse,
  TenderResponse
} from './tenderService'; // Типы для работы с тендерами

export type {
  SendCodeRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
  SendCodeResponse,
  VerifyCodeResponse,
  ResetPasswordResponse
} from './passwordReset';