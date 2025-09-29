import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAppSelector } from '../../store/hooks';

interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  skipped_count: number;
  imported_products: Array<{
    id: number;
    name: string;
    price: number;
    currency: string;
  }>;
  skipped_products: string[];
}

const DashboardImport: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAppSelector(state => state.auth);

  // Функция для скачивания шаблона Excel
  const handleDownloadTemplate = async () => {
    try {
      // Открываем URL в новом окне для скачивания файла
      const downloadUrl = `${import.meta.env.VITE_API_URL || '/api'}/products/import/template/`;

      // Получаем токен авторизации из Redux store
      const token = accessToken;

      // Создаем ссылку для скачивания с авторизацией
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Для авторизованных запросов используем fetch
      if (token) {
        try {
          const response = await fetch(downloadUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.download = 'template_import_products.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Шаблон Excel успешно скачан');
          } else {
            throw new Error('Ошибка скачивания');
          }
        } catch (error) {
          console.error('Ошибка скачивания шаблона:', error);
          toast.error('Ошибка при скачивании шаблона');
        }
      } else {
        toast.error('Необходима авторизация для скачивания шаблона');
      }
    } catch (error) {
      console.error('Ошибка скачивания шаблона:', error);
      toast.error('Ошибка при скачивании шаблона');
    }
  };

  // Функция для обработки загрузки файла
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Проверяем тип файла
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Поддерживаются только файлы Excel (.xlsx, .xls)');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Используем метод uploadFile из API сервиса
      const result = await apiService.uploadFile<ImportResult>('/products/import/', file);

      setUploadResult(result);

      if (result.success) {
        toast.success(`Успешно импортировано ${result.imported_count} товаров`);
      } else {
        toast.error(result.message || 'Ошибка при импорте товаров');
      }
    } catch (error: any) {
      console.error('Ошибка импорта:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.message ||
                          'Ошибка при импорте товаров';
      toast.error(errorMessage);
      setUploadResult({
        success: false,
        message: errorMessage,
        imported_count: 0,
        skipped_count: 0,
        imported_products: [],
        skipped_products: []
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Обработчик выбора файла через input
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Обработчики Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <FileSpreadsheet className="w-8 h-8 mr-3 text-primary-400" />
          Импорт товаров
        </h1>
        <p className="text-dark-300 text-lg mb-8">
          Загрузите Excel файл с товарами для массового добавления в каталог
        </p>

        {/* Инструкция и скачивание шаблона */}
        <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary-400" />
            Начните с шаблона
          </h2>
          <p className="text-dark-300 mb-4">
            Скачайте шаблон Excel с примерами заполнения полей товаров.
            В шаблоне есть все необходимые колонки и образцы данных.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Скачать образец Excel</span>
          </button>
        </div>

        {/* Зона загрузки файла */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-primary-400 bg-primary-500/10'
              : 'border-dark-600 hover:border-dark-500'
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <LoadingSpinner />
              <p className="text-white">Загружаем и обрабатываем файл...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-16 h-16 text-dark-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Перетащите Excel файл сюда или нажмите для выбора
                </h3>
                <p className="text-dark-300 mb-4">
                  Поддерживаются файлы .xlsx и .xls
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-outline"
                >
                  Выбрать файл
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Требования к файлу */}
        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Требования к файлу:
          </h4>
          <ul className="text-dark-300 text-sm space-y-1">
            <li>• <strong className="text-white">name</strong> - обязательное поле (название товара)</li>
            <li>• <strong className="text-white">description</strong> - описание товара (опционально)</li>
            <li>• <strong className="text-white">price</strong> - цена товара (опционально)</li>
            <li>• <strong className="text-white">sku</strong> - артикул товара (опционально)</li>
            <li>• <strong className="text-white">category</strong> - категория товара (опционально)</li>
            <li>• <strong className="text-white">currency</strong> - валюта (KZT, RUB, USD)</li>
            <li>• <strong className="text-white">in_stock</strong> - наличие товара (true/false)</li>
            <li>• Заголовки могут быть в любом регистре (Name, NAME, name)</li>
          </ul>
        </div>
      </motion.div>

      {/* Результаты импорта */}
      {uploadResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center mb-4">
            {uploadResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 mr-3" />
            )}
            <h3 className="text-xl font-bold text-white">
              Результаты импорта
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center mb-2">
                <Package className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-green-300 font-medium">Импортировано</span>
              </div>
              <p className="text-2xl font-bold text-white">{uploadResult.imported_count}</p>
            </div>

            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-yellow-300 font-medium">Пропущено</span>
              </div>
              <p className="text-2xl font-bold text-white">{uploadResult.skipped_count}</p>
            </div>
          </div>

          {/* Список импортированных товаров */}
          {uploadResult.imported_products.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">
                Успешно импортированные товары:
              </h4>
              <div className="bg-dark-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                {uploadResult.imported_products.map((product, index) => (
                  <div key={product.id} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-b-0">
                    <span className="text-white">{product.name}</span>
                    <span className="text-dark-300">
                      {product.price ? `${product.price} ${product.currency}` : 'Цена не указана'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Список пропущенных товаров */}
          {uploadResult.skipped_products.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                Пропущенные строки:
              </h4>
              <div className="bg-red-500/10 rounded-lg p-4 max-h-64 overflow-y-auto border border-red-500/20">
                {uploadResult.skipped_products.map((error, index) => (
                  <div key={index} className="text-red-300 text-sm py-1">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setUploadResult(null)}
              className="btn-outline mr-4"
            >
              Импортировать другой файл
            </button>
            <a
              href="/dashboard/products"
              className="btn-primary"
            >
              Перейти к товарам
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardImport;
