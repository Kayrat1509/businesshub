from django.urls import path
from . import views

urlpatterns = [
    path('', views.ActionLogListView.as_view(), name='actionlog-list'),
]