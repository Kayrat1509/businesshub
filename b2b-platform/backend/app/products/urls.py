from django.urls import path

from . import views

urlpatterns = [
    path("", views.ProductListCreateView.as_view(), name="product-list-create"),
    path("my/", views.MyProductsView.as_view(), name="my-products"),
    path("category/<str:category_name>/", views.products_by_category, name="products-by-category"),
    path("exchange-rates/", views.get_exchange_rates, name="exchange-rates"),
    path("convert-price/", views.convert_price, name="convert-price"),
    path("import/template/", views.download_import_template, name="import-template"),
    path("import/", views.import_products_from_excel, name="import-products"),
    path(
        "<int:pk>/",
        views.ProductRetrieveUpdateDestroyView.as_view(),
        name="product-detail",
    ),
]
