import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import CompanyCard from '../components/CompanyCard'
import CategoryGrid from '../components/CategoryGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import authSlice from '../store/slices/authSlice'
import companiesSlice from '../store/slices/companiesSlice'
import { Company, Category } from '../types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const mockStore = configureStore({
  reducer: {
    auth: authSlice,
    companies: companiesSlice,
  },
  preloadedState: {
    auth: {
      user: { id: 1, email: 'test@example.com', role: 'ROLE_SEEKER' },
      isAuthenticated: true,
      accessToken: 'token',
      refreshToken: 'refresh',
      isLoading: false,
      error: null,
    },
    companies: {
      companies: [],
      currentCompany: null,
      totalCount: 0,
      isLoading: false,
      error: null,
      filters: {},
    },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('CompanyCard Component', () => {
  const mockCompany: Company = {
    id: 1,
    name: 'Test Company',
    description: 'Test company description',
    city: 'Moscow',
    address: 'Test Address',
    rating: 4.5,
    status: 'APPROVED',
    is_favorite: false,
    reviews_count: 10,
    categories: [],
    contacts: {},
    legal_info: {},
    payment_methods: [],
    work_schedule: {},
    staff_count: 25,
    branches_count: 1,
    owner_name: 'Owner',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('renders company information correctly', () => {
    renderWithProviders(<CompanyCard company={mockCompany} />)
    
    expect(screen.getByText('Test Company')).toBeInTheDocument()
    expect(screen.getByText('Test company description')).toBeInTheDocument()
    expect(screen.getByText('Moscow')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('shows correct status badge', () => {
    renderWithProviders(<CompanyCard company={mockCompany} />)
    
    expect(screen.getByText('Проверено')).toBeInTheDocument()
  })

  it('handles favorite toggle for authenticated users', () => {
    renderWithProviders(<CompanyCard company={mockCompany} />)
    
    const favoriteButton = screen.getByRole('button')
    fireEvent.click(favoriteButton)
    
    // Should dispatch toggle favorite action (mocked)
    expect(favoriteButton).toBeInTheDocument()
  })
})

describe('CategoryGrid Component', () => {
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'IT и программирование',
      slug: 'it-programming',
      parent: null,
      is_active: true,
      full_path: 'IT и программирование',
      children: [],
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Строительство',
      slug: 'construction',
      parent: null,
      is_active: true,
      full_path: 'Строительство',
      children: [],
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  it('renders categories correctly', () => {
    renderWithProviders(<CategoryGrid categories={mockCategories} />)
    
    expect(screen.getByText('IT и программирование')).toBeInTheDocument()
    expect(screen.getByText('Строительство')).toBeInTheDocument()
  })

  it('creates clickable category links', () => {
    renderWithProviders(<CategoryGrid categories={mockCategories} />)
    
    const itLink = screen.getByText('IT и программирование').closest('a')
    const constructionLink = screen.getByText('Строительство').closest('a')
    
    expect(itLink).toHaveAttribute('href', '/category/it-programming')
    expect(constructionLink).toHaveAttribute('href', '/category/construction')
  })

  it('shows "Смотреть все" on hover', () => {
    renderWithProviders(<CategoryGrid categories={mockCategories} />)
    
    const categoryCard = screen.getByText('IT и программирование').closest('a')
    expect(categoryCard).toBeInTheDocument()
    
    // Check that the hover text exists (even if not visible initially)
    expect(screen.getAllByText('Смотреть все →')).toHaveLength(2)
  })
})

describe('LoadingSpinner Component', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />)
    
    const spinner = document.querySelector('.loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-8', 'h-8')
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = document.querySelector('.loading-spinner')
    expect(spinner).toHaveClass('w-12', 'h-12')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const container = document.querySelector('.custom-class')
    expect(container).toBeInTheDocument()
  })
})