import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, AlertCircle, CheckCircle } from 'lucide-react';

// Интерфейс для изображения
interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

// Пропсы компонента
interface ImageUploaderProps {
  value?: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

// Утилитные функции для обработки изображений
const createImageFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        file,
        preview: reader.result as string,
        id: Math.random().toString(36).substr(2, 9)
      });
    };
    reader.readAsDataURL(file);
  });
};

// Функция масштабирования изображения до 600x600
const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Устанавливаем размер канваса 600x600
      canvas.width = 600;
      canvas.height = 600;

      // Вычисляем масштаб для обрезки по центру
      const scale = Math.max(600 / img.width, 600 / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Центрируем изображение
      const x = (600 - scaledWidth) / 2;
      const y = (600 - scaledHeight) / 2;

      // Очищаем канвас и рисуем изображение
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      }

      // Конвертируем в Blob и создаем новый File
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        } else {
          resolve(file); // Возвращаем оригинальный файл в случае ошибки
        }
      }, file.type, 0.9); // Качество сжатия 90%
    };

    img.src = URL.createObjectURL(file);
  });
};

// Основной компонент
const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  maxImages = 5,
  className = '',
  disabled = false,
  label = 'Фотографии товара',
  description = 'Загрузите фото товара (JPG, PNG, WebP). Изображения будут автоматически обрезаны до 600x600 пикселей.'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Валидация файла
  const validateFile = (file: File): string | null => {
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Разрешены только файлы JPG, PNG и WebP';
    }

    // Проверка размера файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'Размер файла не должен превышать 10MB';
    }

    return null;
  };

  // Обработка выбранных файлов
  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    setUploading(true);
    setError(null);

    try {
      const fileArray = Array.from(files);

      // Проверяем лимит на количество изображений
      if (value.length + fileArray.length > maxImages) {
        setError(`Можно загрузить максимум ${maxImages} изображений`);
        setUploading(false);
        return;
      }

      // Валидируем и обрабатываем файлы
      const processedImages: ImageFile[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          setUploading(false);
          return;
        }

        try {
          // Масштабируем изображение до 600x600
          const resizedFile = await resizeImage(file);
          // Создаем объект изображения с превью
          const imageFile = await createImageFile(resizedFile);
          processedImages.push(imageFile);
        } catch (err) {
          console.error('Ошибка обработки изображения:', err);
          setError('Ошибка при обработке изображения');
          setUploading(false);
          return;
        }
      }

      // Обновляем состояние
      onChange([...value, ...processedImages]);
    } catch (err) {
      console.error('Ошибка загрузки файлов:', err);
      setError('Ошибка при загрузке файлов');
    } finally {
      setUploading(false);
    }
  }, [value, onChange, maxImages, disabled]);

  // Обработчики drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Обработчик выбора файлов через input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Удаление изображения
  const removeImage = useCallback((id: string) => {
    const updatedImages = value.filter(img => img.id !== id);
    onChange(updatedImages);

    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [value, onChange]);

  // Открытие файлового диалога
  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Лейбл и описание */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          {label}
        </label>
        <p className="text-xs text-dark-400 mb-4">
          {description}
        </p>
      </div>

      {/* Область загрузки */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${dragActive
            ? 'border-primary-400 bg-primary-500/10'
            : 'border-dark-600 hover:border-dark-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mb-3"></div>
              <p className="text-dark-300">Обработка изображений...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Camera className="w-8 h-8 text-dark-400 mb-3" />
              <p className="text-white font-medium mb-1">
                Нажмите для выбора или перетащите файлы
              </p>
              <p className="text-dark-400 text-sm">
                {maxImages - value.length} из {maxImages} изображений доступно
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Превью загруженных изображений */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative aspect-square bg-dark-800 rounded-lg overflow-hidden border border-dark-700">
                <img
                  src={image.preview}
                  alt="Превью товара"
                  className="w-full h-full object-cover"
                />

                {/* Оверлей с кнопкой удаления */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Индикатор успешной загрузки */}
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка добавления еще фото */}
      {value.length > 0 && value.length < maxImages && !uploading && (
        <button
          type="button"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full p-4 border border-dashed border-dark-600 text-dark-300 rounded-lg hover:border-dark-500 hover:text-white transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          <span>Добавить еще фото</span>
        </button>
      )}
    </div>
  );
};

export default ImageUploader;