from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('app.users.urls')),
    path('api/companies/', include('app.companies.urls')),
    path('api/products/', include('app.products.urls')),
    path('api/categories/', include('app.categories.urls')),
    path('api/reviews/', include('app.reviews.urls')),
    path('api/tenders/', include('app.tenders.urls')),
    path('api/ads/', include('app.ads.urls')),
    path('api/favorites/', include('app.users.favorites_urls')),
    path('api/import/', include('app.common.urls')),
    path('api/logs/', include('app.logs.urls')),
    
    # API Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)