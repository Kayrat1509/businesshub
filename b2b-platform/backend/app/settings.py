# Импорт библиотек для конфигурации Django
import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import config

# Базовая директория проекта - путь к корневой папке проекта
BASE_DIR = Path(__file__).resolve().parent.parent

# Секретный ключ Django для криптографических операций (должен быть уникальным в продакшене)
SECRET_KEY = config("SECRET_KEY", default="django-insecure-change-me")

# Режим отладки - включен только в разработке, выключен в продакшене
DEBUG = config("DEBUG", default=False, cast=bool)

# Список разрешенных хостов для обращения к приложению
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1,orbiz.asia,api.orbiz.asia,testserver").split(",")

# Стандартные приложения Django (админка, аутентификация, сессии и т.д.)
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# Сторонние библиотеки и пакеты
THIRD_PARTY_APPS = [
    "rest_framework",  # Django REST Framework для API
    "rest_framework_simplejwt",  # JWT аутентификация
    "corsheaders",  # Обработка CORS заголовков
    "django_filters",  # Фильтрация данных
    "drf_spectacular",  # Автогенерация документации API
    "import_export",  # Импорт/экспорт данных в админке
]

# Локальные приложения проекта (модули B2B платформы)
LOCAL_APPS = [
    "app.users",  # Модуль пользователей
    "app.companies",  # Модуль компаний
    "app.products",  # Модуль товаров
    "app.categories",  # Модуль категорий
    "app.reviews",  # Модуль отзывов
    "app.tenders",  # Модуль тендеров
    "app.ads",  # Модуль объявлений
    "app.logs",  # Модуль логирования
    "app.common",  # Общие компоненты
]

# Полный список всех установленных приложений
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# Middleware - промежуточное ПО для обработки запросов и ответов
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # CORS политики - ДОЛЖЕН БЫТЬ ПЕРВЫМ
    "django.middleware.security.SecurityMiddleware",  # Безопасность
    "django.contrib.sessions.middleware.SessionMiddleware",  # Сессии
    "django.middleware.common.CommonMiddleware",  # Общие функции
    "django.middleware.csrf.CsrfViewMiddleware",  # Защита от CSRF атак
    "django.contrib.auth.middleware.AuthenticationMiddleware",  # Аутентификация
    "django.contrib.messages.middleware.MessageMiddleware",  # Сообщения
    "django.middleware.clickjacking.XFrameOptionsMiddleware",  # Защита от clickjacking
    "app.common.middleware.ActionLogMiddleware",  # Логирование действий пользователей
]

# Главный модуль URL конфигурации
ROOT_URLCONF = "app.urls"

# Конфигурация шаблонов Django
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",  # Движок шаблонов
        "DIRS": [BASE_DIR / "templates"],  # Дополнительные директории с шаблонами
        "APP_DIRS": True,  # Поиск шаблонов в приложениях
        "OPTIONS": {
            "context_processors": [  # Процессоры контекста для шаблонов
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# WSGI приложение для развертывания
WSGI_APPLICATION = "app.wsgi.application"

# Конфигурация базы данных (по умолчанию SQLite, можно переопределить через переменные окружения)
DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL", default="sqlite:///db.sqlite3")
    )
}

# Валидаторы паролей для обеспечения безопасности
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",  # Проверка схожести с данными пользователя
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",  # Минимальная длина пароля
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",  # Проверка на распространенные пароли
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",  # Запрет полностью цифровых паролей
    },
]

# Настройки интернационализации
LANGUAGE_CODE = "ru-ru"  # Язык по умолчанию
TIME_ZONE = "Europe/Moscow"  # Часовой пояс
USE_I18N = True  # Включение интернационализации
USE_TZ = True  # Включение поддержки часовых поясов

# Конфигурация статических файлов (CSS, JavaScript, изображения)
STATIC_URL = "/static/"  # URL префикс для статических файлов
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")  # Директория для сборки статики

# Конфигурация медиа файлов (загружаемые пользователями файлы)
MEDIA_URL = config("MEDIA_URL", default="/media/")  # URL префикс для медиа файлов
MEDIA_ROOT = os.path.join(BASE_DIR, config("MEDIA_ROOT", default="media"))  # Директория медиа файлов

# Тип первичного ключа по умолчанию для всех моделей
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Кастомная модель пользователя вместо стандартной Django User
AUTH_USER_MODEL = "users.User"

# Настройки Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (  # Классы аутентификации по умолчанию
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [  # Классы разрешений по умолчанию
        "rest_framework.permissions.IsAuthenticated",  # Требуется аутентификация
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",  # Пагинация
    "PAGE_SIZE": 20,  # Количество элементов на странице
    "DEFAULT_FILTER_BACKENDS": [  # Бэкенды фильтрации
        "django_filters.rest_framework.DjangoFilterBackend",  # Django filters
        "rest_framework.filters.SearchFilter",  # Поиск
        "rest_framework.filters.OrderingFilter",  # Сортировка
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",  # Автогенерация схемы OpenAPI
}

# Настройки JWT токенов для аутентификации
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(  # Время жизни access токена
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME", default=60, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(  # Время жизни refresh токена
        minutes=config("JWT_REFRESH_TOKEN_LIFETIME", default=1440, cast=int)
    ),
    "ROTATE_REFRESH_TOKENS": True,  # Ротация refresh токенов
    "BLACKLIST_AFTER_ROTATION": True,  # Блокировка старых токенов после ротации
    "UPDATE_LAST_LOGIN": False,  # Не обновлять last_login при каждом запросе
    "ALGORITHM": "HS256",  # Алгоритм шифрования
    "SIGNING_KEY": SECRET_KEY,  # Ключ для подписи
    "VERIFYING_KEY": None,  # Ключ для верификации (для асимметричного шифрования)
    "AUDIENCE": None,  # Аудитория токена
    "ISSUER": None,  # Издатель токена
    "JWK_URL": None,  # URL для получения JWK
    "LEEWAY": 0,  # Допустимая разница во времени
}

# Настройки CORS для работы с продакшн фронтендом
CORS_ALLOW_ALL_ORIGINS = False  # Использовать только указанные домены
CORS_ALLOWED_ORIGINS = [  # Разрешенные домены для CORS запросов
    "https://orbiz.asia",  # Продакшн frontend домен
]
CORS_ALLOW_CREDENTIALS = True  # Разрешить отправку cookies и других credentials
CORS_ALLOWED_HEADERS = [  # Разрешенные заголовки в CORS запросах
    'authorization',
    'content-type',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [  # Разрешенные HTTP методы
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

# Настройки CSRF для безопасной работы с продакшн доменами
CSRF_TRUSTED_ORIGINS = [
    "https://orbiz.asia",  # Продакшн frontend домен
]
# Дополнительные настройки CSRF для корректной работы с CORS
CSRF_COOKIE_HTTPONLY = False  # Разрешить доступ к CSRF cookie из JavaScript
CSRF_COOKIE_SAMESITE = 'Lax'  # Настройка SameSite для CSRF cookie
CSRF_COOKIE_SECURE = True  # Использовать secure cookie в продакшене

# Настройки для автогенерации документации API через drf-spectacular
SPECTACULAR_SETTINGS = {
    "TITLE": "B2B Platform API",  # Название API
    "DESCRIPTION": "API for B2B supplier search platform",  # Описание API
    "VERSION": "1.0.0",  # Версия API
    "SERVE_INCLUDE_SCHEMA": False,  # Не включать схему в endpoint
    "COMPONENT_SPLIT_REQUEST": True,  # Разделять request и response схемы
}

# Настройки загрузки файлов
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # Максимальный размер файла в памяти (50MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # Максимальный размер данных в памяти (50MB)
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10240  # Максимальное количество полей

# Настройки валидации изображений
LOGO_MAX_SIZE = (600, 600)  # Максимальный размер логотипа компании 600x600 пикселей
LOGO_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "webp"]  # Разрешенные форматы изображений
# Для рекламных изображений разрешены любые размеры и форматы
AD_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "webp"]  # Все популярные форматы для рекламы
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")