import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import authSlice from '../store/slices/authSlice';

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    auth: authSlice,
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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Вход в систему')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите ваш email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите ваш пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /войти/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email обязателен')).toBeInTheDocument();
      expect(screen.getByText('Пароль обязателен')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText('Введите ваш email');
    const submitButton = screen.getByRole('button', { name: /войти/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Некорректный email')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByPlaceholderText('Введите ваш пароль');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByText('Создать аккаунт')).toBeInTheDocument();
    expect(screen.getByText('Тип аккаунта')).toBeInTheDocument();
    expect(screen.getByText('Покупатель')).toBeInTheDocument();
    expect(screen.getByText('Поставщик')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите ваш email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите имя пользователя')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByPlaceholderText('Создайте надежный пароль');
    const confirmInput = screen.getByPlaceholderText('Повторите пароль');
    const submitButton = screen.getByRole('button', { name: /создать аккаунт/i });
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Пароли должны совпадать')).toBeInTheDocument();
    });
  });

  it('allows role selection', () => {
    renderWithProviders(<Register />);
    
    const supplierOption = screen.getByText('Поставщик');
    const seekerOption = screen.getByText('Покупатель');
    
    // Default should be seeker
    expect(seekerOption.closest('label')).toHaveClass('border-primary-500');
    
    // Click supplier option
    fireEvent.click(supplierOption);
    expect(supplierOption.closest('label')).toHaveClass('border-primary-500');
  });
});