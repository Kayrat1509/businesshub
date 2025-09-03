from django.urls import path

from . import views

urlpatterns = [
    path(
        "companies-excel/",
        views.ExcelImportView.as_view(),
        name="import-companies-excel",
    ),
]
