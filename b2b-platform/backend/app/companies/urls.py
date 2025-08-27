from django.urls import path
from . import views

urlpatterns = [
    path('', views.CompanyListCreateView.as_view(), name='company-list-create'),
    path('my/', views.MyCompaniesView.as_view(), name='my-companies'),
    path('<int:pk>/', views.CompanyRetrieveUpdateDestroyView.as_view(), name='company-detail'),
    path('<int:company_id>/branches/', views.BranchListCreateView.as_view(), name='company-branches'),
    path('<int:company_id>/employees/', views.EmployeeListCreateView.as_view(), name='company-employees'),
]