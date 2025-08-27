import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { login, clearError } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'

const schema = yup.object({
  email: yup
    .string()
    .required('Email обязателен')
    .email('Некорректный email'),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
})

type LoginFormData = yup.InferType<typeof schema>

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth)
  
  const [showPassword, setShowPassword] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await dispatch(login(data)).unwrap()
      toast.success('Добро пожаловать!')
    } catch (error) {
      // Error handled by useEffect
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Вход в систему</h1>
        <p className="text-dark-300">Войдите в свой аккаунт для продолжения</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Email адрес
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Введите ваш email"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className={`input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Введите ваш пароль"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link 
            to="/auth/forgot-password" 
            className="text-sm link hover:text-primary-300"
          >
            Забыли пароль?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="loading-spinner w-5 h-5" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Войти</span>
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-8 text-center border-t border-dark-700 pt-6">
        <p className="text-dark-300 text-sm">
          Нет аккаунта?{' '}
          <Link to="/auth/register" className="link font-medium">
            Зарегистрироваться
          </Link>
        </p>
      </div>

      {/* Demo Accounts */}
      <div className="mt-6 p-4 bg-dark-700 rounded-lg">
        <p className="text-dark-300 text-sm mb-3 font-medium">Демо-аккаунты:</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-dark-400">Поставщик:</span>
            <span className="text-white">supplier@example.com / Supplier123!</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Покупатель:</span>
            <span className="text-white">seeker@example.com / Seeker123!</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Админ:</span>
            <span className="text-white">admin@example.com / Admin123!</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Login