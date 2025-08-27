import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { 
  Building2, Upload, MapPin, Phone, Mail, Globe, 
  Users, Calendar, Save, AlertCircle, Check, X
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchCategories } from '../../store/slices/categoriesSlice'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../components/LoadingSpinner'

const schema = yup.object({
  name: yup.string().required('Название компании обязательно'),
  description: yup.string().required('Описание компании обязательно'),
  city: yup.string().required('Город обязателен'),
  address: yup.string().required('Адрес обязателен'),
  staff_count: yup.number().min(1, 'Минимум 1 сотрудник'),
  latitude: yup.number().nullable(),
  longitude: yup.number().nullable(),
})

type CompanyFormData = yup.InferType<typeof schema>

const Company = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(state => state.auth)
  const { categories, isLoading: categoriesLoading } = useAppSelector(state => state.categories)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [contacts, setContacts] = useState({
    phones: [''],
    emails: [''],
    website: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [workSchedule, setWorkSchedule] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true },
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate image dimensions (600x600)
      const img = new Image()
      img.onload = () => {
        if (img.width !== 600 || img.height !== 600) {
          toast.error('Логотип должен быть размером 600x600 пикселей')
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
      img.src = URL.createObjectURL(file)
    }
  }

  const addContactField = (type: 'phones' | 'emails') => {
    setContacts(prev => ({
      ...prev,
      [type]: [...prev[type], ''],
    }))
  }

  const updateContactField = (type: 'phones' | 'emails', index: number, value: string) => {
    setContacts(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item),
    }))
  }

  const removeContactField = (type: 'phones' | 'emails', index: number) => {
    setContacts(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true)
    try {
      // Prepare form data
      const formData = {
        ...data,
        contacts: {
          phones: contacts.phones.filter(phone => phone.trim()),
          emails: contacts.emails.filter(email => email.trim()),
          website: contacts.website,
        },
        categories: selectedCategories,
        work_schedule: workSchedule,
      }

      // Here would be the API call to create/update company
      console.log('Company data:', formData)
      
      toast.success('Компания успешно сохранена!')
    } catch (error) {
      toast.error('Ошибка при сохранении компании')
    } finally {
      setIsSubmitting(false)
    }
  }

  const dayNames = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
  }

  if (categoriesLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Управление компанией</h1>
          <p className="text-dark-300 mt-2">
            Создайте или обновите информацию о вашей компании
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 text-sm">
            После создания компания пройдет модерацию
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <Building2 className="w-6 h-6 mr-3 text-primary-400" />
            Основная информация
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Логотип компании (600x600px)
              </label>
              <div className="flex items-start space-x-6">
                <div className="w-32 h-32 border-2 border-dashed border-dark-600 rounded-lg flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                      <span className="text-dark-400 text-sm">Загрузить</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="btn-outline cursor-pointer inline-block"
                  >
                    Выбрать файл
                  </label>
                  <p className="text-dark-400 text-sm mt-2">
                    Поддерживаются форматы: JPG, PNG. Размер: 600x600px.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Название компании *
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="ООО 'Ваша компания'"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Staff Count */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Количество сотрудников
              </label>
              <input
                type="number"
                {...register('staff_count')}
                className={`input ${errors.staff_count ? 'border-red-500' : ''}`}
                placeholder="10"
                min="1"
              />
              {errors.staff_count && (
                <p className="mt-1 text-sm text-red-400">{errors.staff_count.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Описание компании *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={`input ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Расскажите о вашей компании, видах деятельности и преимуществах..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <Phone className="w-6 h-6 mr-3 text-secondary-400" />
            Контактная информация
          </h2>

          <div className="space-y-6">
            {/* Phones */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Телефоны
              </label>
              <div className="space-y-2">
                {contacts.phones.map((phone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => updateContactField('phones', index, e.target.value)}
                      className="input flex-1"
                      placeholder="+7 (999) 123-45-67"
                    />
                    {contacts.phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactField('phones', index)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addContactField('phones')}
                  className="btn-ghost text-sm"
                >
                  + Добавить телефон
                </button>
              </div>
            </div>

            {/* Emails */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Email адреса
              </label>
              <div className="space-y-2">
                {contacts.emails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateContactField('emails', index, e.target.value)}
                      className="input flex-1"
                      placeholder="info@company.com"
                    />
                    {contacts.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactField('emails', index)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addContactField('emails')}
                  className="btn-ghost text-sm"
                >
                  + Добавить email
                </button>
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Веб-сайт
              </label>
              <input
                type="url"
                value={contacts.website}
                onChange={(e) => setContacts(prev => ({ ...prev, website: e.target.value }))}
                className="input"
                placeholder="https://company.com"
              />
            </div>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <MapPin className="w-6 h-6 mr-3 text-green-400" />
            Местоположение
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Город *
              </label>
              <input
                type="text"
                {...register('city')}
                className={`input ${errors.city ? 'border-red-500' : ''}`}
                placeholder="Москва"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Адрес *
              </label>
              <input
                type="text"
                {...register('address')}
                className={`input ${errors.address ? 'border-red-500' : ''}`}
                placeholder="ул. Ленина, д. 1"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Широта (необязательно)
              </label>
              <input
                type="number"
                step="any"
                {...register('latitude')}
                className="input"
                placeholder="55.7558"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Долгота (необязательно)
              </label>
              <input
                type="number"
                step="any"
                {...register('longitude')}
                className="input"
                placeholder="37.6176"
              />
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-end space-x-4"
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 px-8 py-3"
          >
            {isSubmitting ? (
              <div className="loading-spinner w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{isSubmitting ? 'Сохранение...' : 'Сохранить компанию'}</span>
          </button>
        </motion.div>
      </form>
    </div>
  )
}

export default Company