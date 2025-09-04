import { apiService, PaginatedApiResponse } from './apiService';
import { Product, ProductFilters } from '../types';

export interface CreateProductRequest {
  title: string;
  sku?: string;
  description: string;
  price?: number;
  currency: 'KZT' | 'RUB' | 'USD';
  is_service: boolean;
  category?: number;
  images?: string[];
  in_stock?: boolean;
  is_active?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface ProductsResponse extends PaginatedApiResponse<Product> {}

class ProductService {
  private readonly BASE_URL = '/products';

  // Get all products with optional filters
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
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
    
    return apiService.get<ProductsResponse>(url);
  }

  // Get single product by ID
  async getProduct(id: number): Promise<Product> {
    return apiService.get<Product>(`${this.BASE_URL}/${id}/`);
  }

  // Create new product
  async createProduct(data: CreateProductRequest): Promise<Product> {
    return apiService.post<Product>(`${this.BASE_URL}/`, data);
  }

  // Update existing product
  async updateProduct(id: number, data: Partial<CreateProductRequest>): Promise<Product> {
    return apiService.patch<Product>(`${this.BASE_URL}/${id}/`, data);
  }

  // Delete product
  async deleteProduct(id: number): Promise<void> {
    return apiService.delete(`${this.BASE_URL}/${id}/`);
  }

  // Get user's own products
  async getMyProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `${this.BASE_URL}/my/?${queryString}` : `${this.BASE_URL}/my/`;
    
    return apiService.get<ProductsResponse>(url);
  }

  // Get products by category
  async getProductsByCategory(categoryName: string): Promise<Product[]> {
    return apiService.get<Product[]>(`${this.BASE_URL}/category/${encodeURIComponent(categoryName)}/`);
  }

  // Upload product images
  async uploadProductImages(productId: number, files: File[]): Promise<{ images: string[] }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    formData.append('product_id', productId.toString());

    return apiService.upload<{ images: string[] }>(`${this.BASE_URL}/${productId}/images/`, formData);
  }

  // Delete product image
  async deleteProductImage(productId: number, imageId: number): Promise<void> {
    return apiService.delete(`${this.BASE_URL}/${productId}/images/${imageId}/`);
  }

  // Search products
  async searchProducts(query: string, filters?: Omit<ProductFilters, 'q'>): Promise<ProductsResponse> {
    const searchFilters: ProductFilters = { ...filters, q: query };
    return this.getProducts(searchFilters);
  }

  // Get product statistics (for dashboard)
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    services: number;
    products: number;
    in_stock: number;
    out_of_stock: number;
  }> {
    return apiService.get<any>(`${this.BASE_URL}/stats/`);
  }

  // Bulk operations
  async bulkUpdateProducts(updates: { id: number; data: Partial<CreateProductRequest> }[]): Promise<Product[]> {
    return apiService.post<Product[]>(`${this.BASE_URL}/bulk-update/`, { updates });
  }

  async bulkDeleteProducts(ids: number[]): Promise<{ deleted_count: number }> {
    return apiService.post<{ deleted_count: number }>(`${this.BASE_URL}/bulk-delete/`, { ids });
  }

  // Toggle product active status
  async toggleProductStatus(id: number): Promise<Product> {
    return apiService.post<Product>(`${this.BASE_URL}/${id}/toggle-status/`);
  }

  // Duplicate product
  async duplicateProduct(id: number): Promise<Product> {
    return apiService.post<Product>(`${this.BASE_URL}/${id}/duplicate/`);
  }

  // Get product reviews/ratings (if implemented)
  async getProductReviews(productId: number): Promise<any[]> {
    return apiService.get<any[]>(`${this.BASE_URL}/${productId}/reviews/`);
  }

  // Export products to CSV/Excel
  async exportProducts(filters?: ProductFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
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

  // Import products from CSV/Excel
  async importProducts(file: File): Promise<{ success_count: number; error_count: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiService.upload<{ success_count: number; error_count: number; errors: any[] }>(
      `${this.BASE_URL}/import/`,
      formData
    );
  }
}

export const productService = new ProductService();
export default productService;