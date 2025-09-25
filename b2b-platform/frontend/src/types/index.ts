// User types
export interface User {
  id: number
  email: string
  username: string
  role: 'ROLE_SEEKER' | 'ROLE_SUPPLIER' | 'ROLE_ADMIN'
  first_name: string
  last_name: string
  phone: string
  company_id?: number  // добавлено для поддержки связи с компанией
  created_at: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  password_confirm: string
  role: 'ROLE_SEEKER' | 'ROLE_SUPPLIER'
  first_name?: string
  last_name?: string
  phone?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

// Category types
export interface Category {
  id: number
  name: string
  slug: string
  parent?: number
  is_active: boolean
  full_path: string
  children: Category[]
  created_at: string
}

// Company types
export interface Company {
  id: number
  name: string
  logo?: string
  description: string
  categories: Category[]
  supplier_type?: 'DEALER' | 'MANUFACTURER' | 'TRADE_REPRESENTATIVE'
  contacts: {
    phones?: string[]
    emails?: string[]
    website?: string
    phone?: string  // для совместимости с backend
    email?: string  // для совместимости с backend
    social?: {
      [key: string]: string
    }
  }
  legal_info: Record<string, any>
  payment_methods: string[]
  work_schedule: Record<string, any>
  staff_count: number
  branches_count: number
  latitude?: number
  longitude?: number
  city: string
  address: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'BANNED'
  rating: number
  owner_name: string
  is_favorite: boolean
  reviews_count?: number
  products?: Product[]
  branches?: Branch[]
  employees?: Employee[]
  created_at: string
  updated_at: string
}

export interface Branch {
  id: number
  address: string
  latitude: number
  longitude: number
  phone: string
  created_at: string
}

export interface Employee {
  id: number
  full_name: string
  position: string
  phone: string
  email: string
  created_at: string
}

// Product types
export interface Product {
  id: number
  title: string
  sku?: string
  description: string
  price?: number
  currency: 'KZT' | 'RUB' | 'USD'
  is_service: boolean
  category?: Category
  company_name: string
  // добавлен город компании для фильтрации
  company_city?: string
  primary_image?: string
  product_images?: ProductImage[]
  images: string[]
  rating: number
  in_stock: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: number
  image: string
  alt_text: string
  is_primary: boolean
  created_at: string
}

// Review types
export interface Review {
  id: number
  rating: number
  text: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  admin_comment?: string
  author_name: string
  author_email: string
  company_name: string
  created_at: string
  updated_at: string
}

// Tender types
export interface Tender {
  id: number
  title: string
  description: string
  categories: Category[]
  city: string
  budget_min?: number
  budget_max?: number
  currency: 'KZT' | 'USD' | 'RUB'
  deadline_date?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  attachments: string[]
  tender_attachments?: TenderAttachment[]
  author_name: string
  company?: {
    id: number
    name: string
    logo?: string
  }
  admin_comment?: string
  created_at: string
  updated_at: string
}

export interface TenderAttachment {
  id: number
  file: string
  filename: string
  file_size: number
  uploaded_at: string
}

// Ad types
export interface Ad {
  id: number
  title: string
  image: string
  url: string
  // removed sidebar ads positions
  position: 'HOME_WIDGET' | 'BANNER'
  is_active: boolean
  starts_at: string
  ends_at: string
  is_current: boolean
  created_at: string
}

export interface Action {
  id: number
  title: string
  description: string
  company_name: string
  is_active: boolean
  starts_at: string
  ends_at: string
  is_current: boolean
  created_at: string
}

// Favorite types
export interface Favorite {
  id: number
  company: string
  created_at: string
}

// API Response types
export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export interface ApiError {
  message: string
  field?: string
}

// Supplier Type
export interface SupplierType {
  code: 'DEALER' | 'MANUFACTURER' | 'TRADE_REPRESENTATIVE'
  name: string
}

// Filter types
export interface CompanyFilters {
  q?: string
  category?: string
  city?: string
  cities?: string
  supplier_type?: string
  rating_gte?: number
  has_actions?: boolean
  is_popular?: boolean
  status?: string
}

export interface ProductFilters {
  q?: string
  company?: number
  category?: string
  is_service?: boolean
  price_min?: number
  price_max?: number
  in_stock?: boolean
  // добавлены фильтры для поиска на главной странице
  city?: string
  ordering?: string
}

export interface ReviewFilters {
  company?: number
  status?: string
  rating?: number
  rating_gte?: number
  rating_lte?: number
}

export interface TenderFilters {
  q?: string
  category?: string
  city?: string
  budget_min?: number
  budget_max?: number
  status?: string
  page?: number  // добавлено для пагинации
}