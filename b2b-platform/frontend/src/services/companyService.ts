import { apiService, PaginatedApiResponse } from './apiService';
import { Company, CompanyFilters, Branch, Employee } from '../types';

export interface CreateCompanyRequest {
  name: string;
  logo?: File | string;
  description: string;
  categories: number[];
  contacts: {
    phones?: string[];
    emails?: string[];
    website?: string;
  };
  legal_info: Record<string, any>;
  payment_methods: string[];
  work_schedule: Record<string, any>;
  staff_count: number;
  branches_count: number;
  latitude?: number;
  longitude?: number;
  city: string;
  address: string;
}

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  id: number;
}

export interface CompaniesResponse extends PaginatedApiResponse<Company> {}

export interface FavoriteCompanyResponse {
  is_favorite: boolean;
  message: string;
}

class CompanyService {
  private readonly BASE_URL = '/companies';

  // Get all companies with optional filters
  async getCompanies(filters?: CompanyFilters): Promise<CompaniesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `${this.BASE_URL}?${queryString}` : this.BASE_URL;
    
    return apiService.get<CompaniesResponse>(url);
  }

  // Get single company by ID
  async getCompany(id: number): Promise<Company> {
    return apiService.get<Company>(`${this.BASE_URL}/${id}/`);
  }

  // Create new company
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    // Handle file upload if logo is a File
    if (data.logo instanceof File) {
      const formData = new FormData();
      
      // Add logo file
      formData.append('logo', data.logo);
      
      // Add other fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'logo' && value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return apiService.upload<Company>(`${this.BASE_URL}/`, formData);
    }

    return apiService.post<Company>(`${this.BASE_URL}/`, data);
  }

  // Update existing company
  async updateCompany(id: number, data: Partial<CreateCompanyRequest>): Promise<Company> {
    // Handle file upload if logo is a File
    if (data.logo instanceof File) {
      const formData = new FormData();
      
      // Add logo file
      formData.append('logo', data.logo);
      
      // Add other fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'logo' && value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return apiService.upload<Company>(`${this.BASE_URL}/${id}/`, formData);
    }

    return apiService.patch<Company>(`${this.BASE_URL}/${id}/`, data);
  }

  // Delete company
  async deleteCompany(id: number): Promise<void> {
    return apiService.delete(`${this.BASE_URL}/${id}/`);
  }

  // Get user's own companies
  async getMyCompanies(): Promise<Company[]> {
    return apiService.get<Company[]>(`${this.BASE_URL}/my/`);
  }

  // Search companies
  async searchCompanies(query: string, filters?: Omit<CompanyFilters, 'q'>): Promise<CompaniesResponse> {
    const searchFilters: CompanyFilters = { ...filters, q: query };
    return this.getCompanies(searchFilters);
  }

  // Get companies by category
  async getCompaniesByCategory(categorySlug: string): Promise<Company[]> {
    return apiService.get<Company[]>(`${this.BASE_URL}/category/${encodeURIComponent(categorySlug)}/`);
  }

  // Toggle favorite company
  async toggleFavorite(companyId: number): Promise<FavoriteCompanyResponse> {
    return apiService.post<FavoriteCompanyResponse>(`${this.BASE_URL}/${companyId}/toggle-favorite/`);
  }

  // Get favorite companies
  async getFavoriteCompanies(): Promise<Company[]> {
    return apiService.get<Company[]>(`${this.BASE_URL}/favorites/`);
  }

  // Get company statistics
  async getCompanyStats(companyId?: number): Promise<{
    total_views: number;
    total_favorites: number;
    total_products: number;
    total_reviews: number;
    average_rating: number;
    monthly_stats: any[];
  }> {
    const url = companyId 
      ? `${this.BASE_URL}/${companyId}/stats/`
      : `${this.BASE_URL}/stats/`;
    
    return apiService.get<any>(url);
  }

  // Company branches management
  async getCompanyBranches(companyId: number): Promise<Branch[]> {
    return apiService.get<Branch[]>(`${this.BASE_URL}/${companyId}/branches/`);
  }

  async createBranch(companyId: number, data: Omit<Branch, 'id' | 'created_at'>): Promise<Branch> {
    return apiService.post<Branch>(`${this.BASE_URL}/${companyId}/branches/`, data);
  }

  async updateBranch(companyId: number, branchId: number, data: Partial<Branch>): Promise<Branch> {
    return apiService.patch<Branch>(`${this.BASE_URL}/${companyId}/branches/${branchId}/`, data);
  }

  async deleteBranch(companyId: number, branchId: number): Promise<void> {
    return apiService.delete(`${this.BASE_URL}/${companyId}/branches/${branchId}/`);
  }

  // Company employees management
  async getCompanyEmployees(companyId: number): Promise<Employee[]> {
    return apiService.get<Employee[]>(`${this.BASE_URL}/${companyId}/employees/`);
  }

  async createEmployee(companyId: number, data: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    return apiService.post<Employee>(`${this.BASE_URL}/${companyId}/employees/`, data);
  }

  async updateEmployee(companyId: number, employeeId: number, data: Partial<Employee>): Promise<Employee> {
    return apiService.patch<Employee>(`${this.BASE_URL}/${companyId}/employees/${employeeId}/`, data);
  }

  async deleteEmployee(companyId: number, employeeId: number): Promise<void> {
    return apiService.delete(`${this.BASE_URL}/${companyId}/employees/${employeeId}/`);
  }

  // Company verification/status management
  async submitForApproval(companyId: number): Promise<{ message: string; status: string }> {
    return apiService.post<{ message: string; status: string }>(`${this.BASE_URL}/${companyId}/submit-approval/`);
  }

  // Company logo management
  async uploadLogo(companyId: number, logoFile: File): Promise<{ logo: string }> {
    const formData = new FormData();
    formData.append('logo', logoFile);

    return apiService.upload<{ logo: string }>(`${this.BASE_URL}/${companyId}/logo/`, formData);
  }

  async deleteLogo(companyId: number): Promise<void> {
    return apiService.delete(`${this.BASE_URL}/${companyId}/logo/`);
  }

  // Company reviews (if implemented)
  async getCompanyReviews(companyId: number): Promise<any[]> {
    return apiService.get<any[]>(`${this.BASE_URL}/${companyId}/reviews/`);
  }

  async createCompanyReview(companyId: number, data: {
    rating: number;
    text: string;
    author_name?: string;
    author_email?: string;
  }): Promise<any> {
    return apiService.post<any>(`${this.BASE_URL}/${companyId}/reviews/`, data);
  }

  // Popular/featured companies
  async getPopularCompanies(limit: number = 10): Promise<Company[]> {
    return apiService.get<Company[]>(`${this.BASE_URL}/popular/?limit=${limit}`);
  }

  async getFeaturedCompanies(limit: number = 10): Promise<Company[]> {
    return apiService.get<Company[]>(`${this.BASE_URL}/featured/?limit=${limit}`);
  }

  // Company products shortcut
  async getCompanyProducts(companyId: number): Promise<any[]> {
    return apiService.get<any[]>(`/products/?company=${companyId}`);
  }

  // Bulk operations
  async bulkUpdateCompanies(updates: { id: number; data: Partial<CreateCompanyRequest> }[]): Promise<Company[]> {
    return apiService.post<Company[]>(`${this.BASE_URL}/bulk-update/`, { updates });
  }

  // Export companies
  async exportCompanies(filters?: CompanyFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    params.append('format', format);
    
    return apiService.download(`${this.BASE_URL}/export/?${params.toString()}`);
  }

  // Get nearby companies (if geolocation is implemented)
  async getNearbyCompanies(latitude: number, longitude: number, radius: number = 10): Promise<Company[]> {
    return apiService.get<Company[]>(`${this.BASE_URL}/nearby/?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  }

  // Company verification status
  async getVerificationStatus(companyId: number): Promise<{
    status: string;
    verified_at?: string;
    admin_comment?: string;
  }> {
    return apiService.get<any>(`${this.BASE_URL}/${companyId}/verification-status/`);
  }
}

export const companyService = new CompanyService();
export default companyService;