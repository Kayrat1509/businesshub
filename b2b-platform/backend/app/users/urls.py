from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.UserRegistrationView.as_view(), name="user-register"),
    path("token/", views.CustomTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", views.UserProfileView.as_view(), name="user-profile"),
    path("favorites/", views.FavoriteListView.as_view(), name="favorites-list"),
    path(
        "favorites/toggle/<int:company_id>/",
        views.toggle_favorite,
        name="toggle-favorite",
    ),
    path(
        "search-history/",
        views.SearchHistoryListCreateView.as_view(),
        name="search-history",
    ),
    path(
        "search-history/clear/", views.clear_search_history, name="clear-search-history"
    ),
    path(
        "search-history/<int:search_id>/",
        views.delete_search_item,
        name="delete-search-item",
    ),
]
