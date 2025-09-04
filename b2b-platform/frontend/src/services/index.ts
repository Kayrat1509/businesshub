// Main services export file
export { apiService, ApiService } from './apiService';
export { currencyService } from './currencyService';
export { productService } from './productService';
export { companyService } from './companyService';
export { authService } from './authService';

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