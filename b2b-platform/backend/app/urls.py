# Импорт библиотек Django для настройки URL маршрутизации
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Основные URL маршруты приложения
urlpatterns = [
    # Административная панель Django
    path("admin/", admin.site.urls),
    
    # API маршруты для различных модулей B2B платформы
    path("api/auth/", include("app.users.urls")),  # Аутентификация и управление пользователями
    path("api/companies/", include("app.companies.urls")),  # Работа с компаниями
    path("api/products/", include("app.products.urls")),  # Управление товарами и услугами
    path("api/categories/", include(("app.categories.urls", "categories"), namespace="categories")),  # Категории товаров
    path("api/reviews/", include("app.reviews.urls")),  # Система отзывов
    path("api/tenders/", include("app.tenders.urls")),  # Управление тендерами
    path("api/ads/", include("app.ads.urls")),  # Рекламные объявления
    path("api/favorites/", include("app.users.favorites_urls")),  # Избранные товары/компании
    path("api/import/", include("app.common.urls")),  # Импорт данных
    path("api/moderation/", include("app.common.moderation_urls")),  # Модерация контента
    path("api/logs/", include("app.logs.urls")),  # Логирование действий
    
    # Документация API через Swagger/OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),  # Схема API в формате OpenAPI
    path(
        "api/schema/swagger/",  # Swagger UI для интерактивной документации API
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

# В режиме разработки добавляем обслуживание медиа файлов через Django
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
