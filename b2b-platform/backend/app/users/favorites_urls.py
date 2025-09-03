from django.urls import path

from . import views

urlpatterns = [
    path("", views.FavoriteListView.as_view(), name="favorites-list"),
    path("<int:company_id>/", views.toggle_favorite, name="toggle-favorite"),
]
