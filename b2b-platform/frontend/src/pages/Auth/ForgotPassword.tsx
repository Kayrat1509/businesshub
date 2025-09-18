import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, Lock, Eye, EyeOff, CheckCircle, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import passwordResetService from '../../services/passwordReset';

// Схемы валидации для разных этапов
const emailSchema = yup.object({
  email: yup
    .string()
    .required('Email обязателен')
    .email('Некорректный email'),
});

const codeSchema = yup.object({
  code: yup
    .string()
    .required('Код подтверждения обязателен')
    .length(6, 'Код должен содержать 6 цифр')
    .matches(/^\d+$/, 'Код должен содержать только цифры'),
});

const passwordSchema = yup.object({
  password: yup
    .string()
    .required('Новый пароль обязателен')
    .min(8, 'Пароль должен содержать минимум 8 символов'),
  confirmPassword: yup
    .string()
    .required('Подтверждение пароля обязательно')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
});

type EmailFormData = yup.InferType<typeof emailSchema>
type CodeFormData = yup.InferType<typeof codeSchema>
type PasswordFormData = yup.InferType<typeof passwordSchema>

type Step = 'email' | 'code' | 'password' | 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetToken, setResetToken] = useState('');

  // Формы для разных этапов
  const emailForm = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema),
  });

  const codeForm = useForm<CodeFormData>({
    resolver: yupResolver(codeSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  // Отправка кода на почту
  const onSubmitEmail = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      await passwordResetService.sendCode({ email: data.email });

      setUserEmail(data.email);
      setCurrentStep('code');
      toast.success('Код подтверждения отправлен на вашу почту');

      // Запуск таймера для повторной отправки
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Произошла ошибка. Попробуйте позже.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода
  const onSubmitCode = async (data: CodeFormData) => {
    setIsLoading(true);
    try {
      const response = await passwordResetService.verifyCode({
        email: userEmail,
        code: data.code
      });

      setResetToken(response.reset_token);
      setCurrentStep('password');
      toast.success('Код подтверждён');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Неверный код. Попробуйте ещё раз.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Установка нового пароля
  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await passwordResetService.resetPassword({
        email: userEmail,
        reset_token: resetToken,
        password: data.password
      });

      setCurrentStep('success');
      toast.success('Пароль успешно изменён');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Произошла ошибка. Попробуйте позже.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Повторная отправка кода
  const resendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      await passwordResetService.sendCode({ email: userEmail });
      toast.success('Код отправлен повторно');

      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка отправки кода';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Рендер этапа ввода email
  const renderEmailStep = () => (
    <motion.div
      key="email"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Забыли пароль?</h1>
        <p className="text-dark-300">
          Введите email для получения кода подтверждения
        </p>
      </div>

      <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Email адрес
          </label>
          <div className="relative">
            <input
              type="email"
              {...emailForm.register('email')}
              className={`input pl-10 ${emailForm.formState.errors.email ? 'border-red-500' : ''}`}
              placeholder="Введите ваш email"
              disabled={isLoading}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
          {emailForm.formState.errors.email && (
            <p className="mt-1 text-sm text-red-400">{emailForm.formState.errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="loading-spinner w-5 h-5" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Отправить код</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );

  // Рендер этапа ввода кода
  const renderCodeStep = () => (
    <motion.div
      key="code"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Введите код</h1>
        <p className="text-dark-300">
          Код подтверждения отправлен на {userEmail}
        </p>
      </div>

      <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Код подтверждения
          </label>
          <input
            type="text"
            {...codeForm.register('code')}
            className={`input text-center text-2xl tracking-widest ${codeForm.formState.errors.code ? 'border-red-500' : ''}`}
            placeholder="000000"
            maxLength={6}
            disabled={isLoading}
          />
          {codeForm.formState.errors.code && (
            <p className="mt-1 text-sm text-red-400">{codeForm.formState.errors.code.message}</p>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-dark-400 mb-2">Не получили код?</p>
          <button
            type="button"
            onClick={resendCode}
            disabled={resendCooldown > 0 || isLoading}
            className={`text-sm ${resendCooldown > 0 ? 'text-dark-500' : 'text-primary-400 hover:text-primary-300'} transition-colors`}
          >
            {resendCooldown > 0 ? `Отправить повторно через ${resendCooldown}с` : 'Отправить повторно'}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="loading-spinner w-5 h-5" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Подтвердить</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );

  // Рендер этапа создания нового пароля
  const renderPasswordStep = () => (
    <motion.div
      key="password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Новый пароль</h1>
        <p className="text-dark-300">
          Создайте новый надёжный пароль
        </p>
      </div>

      <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Новый пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...passwordForm.register('password')}
              className={`input pl-10 pr-10 ${passwordForm.formState.errors.password ? 'border-red-500' : ''}`}
              placeholder="Введите новый пароль"
              disabled={isLoading}
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
          {passwordForm.formState.errors.password && (
            <p className="mt-1 text-sm text-red-400">{passwordForm.formState.errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...passwordForm.register('confirmPassword')}
              className={`input pl-10 pr-10 ${passwordForm.formState.errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Повторите новый пароль"
              disabled={isLoading}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordForm.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="loading-spinner w-5 h-5" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Изменить пароль</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );

  // Рендер финального экрана
  const renderSuccessStep = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-400" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-4">Готово!</h1>
      <p className="text-dark-300 mb-8">
        Ваш пароль успешно изменён. Теперь вы можете войти в систему с новым паролем.
      </p>

      <button
        onClick={() => navigate('/auth/login')}
        className="btn-primary px-8 py-3"
      >
        Войти в систему
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Прогресс-бар */}
      {currentStep !== 'success' && (
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'email' ? 'bg-primary-500 text-white' :
            ['code', 'password'].includes(currentStep) ? 'bg-green-500 text-white' : 'bg-dark-600 text-dark-400'
          }`}>
            1
          </div>
          <div className={`w-8 h-1 ${
            ['code', 'password'].includes(currentStep) ? 'bg-primary-500' : 'bg-dark-600'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'code' ? 'bg-primary-500 text-white' :
            currentStep === 'password' ? 'bg-green-500 text-white' : 'bg-dark-600 text-dark-400'
          }`}>
            2
          </div>
          <div className={`w-8 h-1 ${
            currentStep === 'password' ? 'bg-primary-500' : 'bg-dark-600'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'password' ? 'bg-primary-500 text-white' : 'bg-dark-600 text-dark-400'
          }`}>
            3
          </div>
        </div>
      )}

      {/* Контент этапов */}
      {currentStep === 'email' && renderEmailStep()}
      {currentStep === 'code' && renderCodeStep()}
      {currentStep === 'password' && renderPasswordStep()}
      {currentStep === 'success' && renderSuccessStep()}

      {/* Навигация назад и альтернативная связь */}
      {currentStep !== 'success' && (
        <>
          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center text-dark-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к входу
            </Link>
          </div>

          <div className="text-center bg-dark-700 p-6 rounded-lg">
            <h3 className="text-white font-medium mb-3">Нужна помощь?</h3>
            <p className="text-dark-300 text-sm mb-4">
              Если у вас возникли проблемы, свяжитесь с поддержкой
            </p>
            <a
              href="https://wa.me/77776323616"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp: +7 777 632 36 16
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;