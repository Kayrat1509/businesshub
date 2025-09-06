import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    role: 'ROLE_SUPPLIER' as 'ROLE_SUPPLIER',
    first_name: '',
    last_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirm) {
      toast.error('Пароли не совпадают');
      return;
    }

    try {
      const { password_confirm, ...registerData } = formData;
      const dataToSend = { ...registerData, password_confirm };
      await dispatch(register(dataToSend)).unwrap();
      toast.success('Регистрация прошла успешно. Добро пожаловать!');
      navigate('/');
    } catch (error: any) {
      // Format error message for better readability
      let errorMessage = error || 'Ошибка регистрации';
      
      // Replace field names with Russian equivalents
      errorMessage = errorMessage
        .replace(/password:/g, 'Пароль:')
        .replace(/email:/g, 'Email:')
        .replace(/username:/g, 'Имя пользователя:')
        .replace(/This password is too short\. It must contain at least 8 characters\./g, 'Пароль слишком короткий. Минимум 8 символов.')
        .replace(/This password is too common\./g, 'Пароль слишком простой. Используйте более сложный пароль.')
        .replace(/A user with that username already exists\./g, 'Пользователь с таким именем уже существует.')
        .replace(/Enter a valid email address\./g, 'Введите корректный email адрес.');
      
      toast.error(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="card p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Регистрация поставщика</h2>
        <p className="text-dark-300">Создайте аккаунт для размещения товаров</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="input"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-dark-200 mb-2">
            Имя пользователя *
          </label>
          <input
            type="text"
            name="username"
            id="username"
            required
            className="input"
            placeholder="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-dark-200 mb-2">
              Имя
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              className="input"
              placeholder="Ваше имя"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-dark-200 mb-2">
              Фамилия
            </label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              className="input"
              placeholder="Ваша фамилия"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">
            Пароль *
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="input"
            placeholder="Минимум 8 символов"
            value={formData.password}
            onChange={handleChange}
          />
          <p className="text-xs text-dark-400 mt-1">
            Минимум 8 символов, используйте сложный пароль
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="password_confirm" className="block text-sm font-medium text-dark-200 mb-2">
            Подтвердите пароль *
          </label>
          <input
            type="password"
            name="password_confirm"
            id="password_confirm"
            required
            className="input"
            placeholder="Повторите пароль"
            value={formData.password_confirm}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 disabled:opacity-50"
        >
          {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-dark-700 pt-6">
        <p className="text-dark-300 text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/auth/login" className="link font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;