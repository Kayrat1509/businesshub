from django.urls import path

from . import views

urlpatterns = [
    # Ads
    path("", views.AdListCreateView.as_view(), name="ad-list-create"),
    path("<int:pk>/", views.AdRetrieveUpdateDestroyView.as_view(), name="ad-detail"),
    # Actions
    path("actions/", views.ActionListCreateView.as_view(), name="action-list-create"),
    path("actions/my/", views.MyActionsView.as_view(), name="my-actions"),
    path(
        "actions/<int:pk>/",
        views.ActionRetrieveUpdateDestroyView.as_view(),
        name="action-detail",
    ),
    # Управление товарами в акциях
    path(
        "actions/<int:action_id>/add-products/",
        views.add_products_to_action,
        name="action-add-products",
    ),
    path(
        "actions/<int:action_id>/remove-products/",
        views.remove_products_from_action,
        name="action-remove-products",
    ),
    path(
        "actions/<int:action_id>/products/",
        views.get_action_products,
        name="action-get-products",
    ),
]
