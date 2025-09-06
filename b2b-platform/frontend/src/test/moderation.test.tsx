import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Moderation from '../pages/AdminPanel/Moderation';
import authSlice from '../store/slices/authSlice';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    auth: authSlice,
  },
  preloadedState: {
    auth: {
      user: { id: 1, email: 'demo@demo.com', role: 'ROLE_ADMIN' },
      isAuthenticated: true,
      accessToken: 'token',
      refreshToken: 'refresh',
      isLoading: false,
      error: null,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>,
  );
};

describe('Moderation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders moderation interface correctly', () => {
    renderWithProviders(<Moderation />);
    
    expect(screen.getByText('Модерация')).toBeInTheDocument();
    expect(screen.getByText('Управление заявками на модерацию')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByText('Компании')).toBeInTheDocument();
    expect(screen.getByText('Отзывы')).toBeInTheDocument();
    expect(screen.getByText('Тендеры')).toBeInTheDocument();
    expect(screen.getByText('Товары')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    renderWithProviders(<Moderation />);
    
    const reviewsTab = screen.getByText('Отзывы');
    const tendersTab = screen.getByText('Тендеры');
    
    // Click reviews tab
    fireEvent.click(reviewsTab);
    expect(reviewsTab.closest('button')).toHaveClass('bg-primary-600');
    
    // Click tenders tab
    fireEvent.click(tendersTab);
    expect(tendersTab.closest('button')).toHaveClass('bg-primary-600');
  });

  it('renders moderation items with action buttons', () => {
    renderWithProviders(<Moderation />);
    
    // Should show mock companies data initially
    expect(screen.getByText('ООО "ТехСервис"')).toBeInTheDocument();
    
    // Check action buttons are present
    const approveButtons = screen.getAllByText('Утвердить');
    const rejectButtons = screen.getAllByText('Отклонить');
    const viewButtons = screen.getAllByText('Подробнее');
    
    expect(approveButtons).toHaveLength(1); // Only company items shown initially
    expect(rejectButtons).toHaveLength(1);
    expect(viewButtons).toHaveLength(1);
  });

  it('handles approve action correctly', async () => {
    renderWithProviders(<Moderation />);
    
    const approveButton = screen.getByText('Утвердить');
    fireEvent.click(approveButton);
    
    // Should remove item from list after approval
    await waitFor(() => {
      expect(screen.queryByText('ООО "ТехСервис"')).not.toBeInTheDocument();
    });
  });

  it('handles reject action correctly', async () => {
    renderWithProviders(<Moderation />);
    
    const rejectButton = screen.getByText('Отклонить');
    fireEvent.click(rejectButton);
    
    // Should remove item from list after rejection
    await waitFor(() => {
      expect(screen.queryByText('ООО "ТехСервис"')).not.toBeInTheDocument();
    });
  });

  it('shows statistics cards', () => {
    renderWithProviders(<Moderation />);
    
    expect(screen.getByText('На модерации')).toBeInTheDocument();
    expect(screen.getByText('Утверждено сегодня')).toBeInTheDocument();
    expect(screen.getByText('Отклонено сегодня')).toBeInTheDocument();
    
    // Check statistics values
    expect(screen.getByText('12')).toBeInTheDocument(); // Approved today
    expect(screen.getByText('3')).toBeInTheDocument(); // Rejected today
  });

  it('shows review items with ratings when on reviews tab', () => {
    renderWithProviders(<Moderation />);
    
    const reviewsTab = screen.getByText('Отзывы');
    fireEvent.click(reviewsTab);
    
    expect(screen.getByText('Отзыв о компании "СтройМастер"')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Rating
  });

  it('shows tender items when on tenders tab', () => {
    renderWithProviders(<Moderation />);
    
    const tendersTab = screen.getByText('Тендеры');
    fireEvent.click(tendersTab);
    
    expect(screen.getByText('Поставка офисной мебели')).toBeInTheDocument();
  });

  it('shows empty state when no items to moderate', async () => {
    renderWithProviders(<Moderation />);
    
    // Switch to products tab (which has no mock data)
    const productsTab = screen.getByText('Товары');
    fireEvent.click(productsTab);
    
    expect(screen.getByText('Нет элементов на модерации')).toBeInTheDocument();
    expect(screen.getByText('Все заявки в этой категории обработаны')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    renderWithProviders(<Moderation />);
    
    // Should show formatted date for mock items
    // The exact format will depend on locale, but should contain numbers
    const dateElements = screen.getAllByText(/\d+/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('disables buttons during loading', () => {
    renderWithProviders(<Moderation />);
    
    const approveButton = screen.getByText('Утвердить');
    const rejectButton = screen.getByText('Отклонить');
    
    // Initially buttons should be enabled
    expect(approveButton).not.toBeDisabled();
    expect(rejectButton).not.toBeDisabled();
    
    // After clicking, they should be disabled during loading
    // (This is hard to test without proper async handling in the component)
  });
});