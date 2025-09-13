from django.urls import path

from . import views

urlpatterns = [
    path("", views.CategoryListCreateView.as_view(), name="category-list-create"),
    path("tree/", views.category_tree, name="category-tree"),
    path("import/", views.import_categories_from_excel, name="category-import"),
    path(
        "<slug:slug>/",
        views.CategoryRetrieveUpdateDestroyView.as_view(),
        name="category-detail",
    ),
]
