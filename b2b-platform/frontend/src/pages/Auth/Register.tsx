import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Phone } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { register as registerUser, clearError } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'

const schema = yup.object({
  email: yup
    .string()
    .required('Email обязателен')
    .email('Некорректный email'),
  username: yup
    .string()
    .required('Имя пользователя обязательно')
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов'),
  first_name: yup.string(),
  last_name: yup.string(),
  phone: yup.string(),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .matches(/(?=.*[a-z])/, 'Должна быть минимум одна строчная буква')
    .matches(/(?=.*[A-Z])/, 'Должна быть минимум одна заглавная буква')
    .matches(/(?=.*\d)/, 'Должна быть минимум одна цифра'),
  password_confirm: yup
    .string()
    .required('Подтверждение пароля обязательно')
    .oneOf([yup.ref('password')], 'Пароли должны совпадать'),
  role: yup
    .string()
    .required('Выберите тип аккаунта')
    .oneOf(['ROLE_SEEKER', 'ROLE_SUPPLIER'], 'Некорректный тип аккаунта'),
})

type RegisterFormData = yup.InferType<typeof schema>

const Register = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'ROLE_SEEKER',
    },
  })

  const selectedRole = watch('role')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Ошибка регистрации')
      dispatch(clearError())
    }
  }, [error, dispatch])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await dispatch(registerUser(data)).unwrap()
      toast.success('Регистрация успешна! Добро пожаловать!')
    } catch (error) {
      // Error handled by useEffect
    }
  }

  const roleOptions = [
    {
      value: 'ROLE_SEEKER',
      title: 'Покупатель',
      description: 'Ищете товары и услуги для своего бизнеса',
    },
    {
      value: 'ROLE_SUPPLIER',
      title: 'Поставщик',
      description: 'Предлагаете товары и услуги другим компаниям',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Создать аккаунт</h1>
        <p className="text-dark-300">Присоединяйтесь к нашей B2B платформе</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-3">
            Тип аккаунта
          </label>
          <div className="grid grid-cols-1 gap-3">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedRole === option.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('role')}
                  className="sr-only"
                />
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                    selectedRole === option.value
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-dark-400'
                  }`}>
                    {selectedRole === option.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{option.title}</h3>
                    <p className="text-dark-300 text-sm">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>
          )}
        </div>

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

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Имя пользователя
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('username')}
              className={`input pl-10 ${errors.username ? 'border-red-500' : ''}`}
              placeholder="Введите имя пользователя"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
          {errors.username && (
            <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Имя
            </label>
            <input
              type="text"
              {...register('first_name')}
              className="input"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Фамилия
            </label>
            <input
              type="text"
              {...register('last_name')}
              className="input"
              placeholder="Ваша фамилия"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Телефон (необязательно)
          </label>
          <div className="relative">
            <input
              type="tel"
              {...register('phone')}
              className="input pl-10"
              placeholder="+7 (999) 123-45-67"
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
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
              placeholder="Создайте надежный пароль"
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

        {/* Password Confirmation */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              {...register('password_confirm')}
              className={`input pl-10 pr-10 ${errors.password_confirm ? 'border-red-500' : ''}`}
              placeholder="Повторите пароль"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
            >
              {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password_confirm && (
            <p className="mt-1 text-sm text-red-400">{errors.password_confirm.message}</p>
          )}
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
              <UserPlus className="w-5 h-5" />
              <span>Создать аккаунт</span>
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center border-t border-dark-700 pt-6">
        <p className="text-dark-300 text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/auth/login" className="link font-medium">
            Войти
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

export default Register