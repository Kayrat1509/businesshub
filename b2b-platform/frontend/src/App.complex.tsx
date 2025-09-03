import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from './store/hooks';
import { initializeAuth } from './store/slices/authSlice';

// Layout components
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import CompanyCard from './pages/CompanyCard';
import Category from './pages/Category';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboard pages
import SupplierDashboard from './pages/SupplierDashboard';
import DashboardCompany from './pages/SupplierDashboard/Company';
import DashboardProducts from './pages/SupplierDashboard/Products';
import DashboardImport from './pages/SupplierDashboard/Import';
import DashboardActions from './pages/SupplierDashboard/Actions';
import DashboardSettings from './pages/SupplierDashboard/Settings';

// Admin pages
import AdminPanel from './pages/AdminPanel';
import AdminModeration from './pages/AdminPanel/Moderation';
import AdminCategories from './pages/AdminPanel/Categories';
import AdminReviews from './pages/AdminPanel/Reviews';
import AdminTenders from './pages/AdminPanel/Tenders';
import AdminImport from './pages/AdminPanel/Import';

// Protected route components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="company/:id" element={<CompanyCard />} />
          <Route path="category/:slug" element={<Category />} />
        </Route>

        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Supplier Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="ROLE_SUPPLIER">
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SupplierDashboard />} />
          <Route path="company" element={<DashboardCompany />} />
          <Route path="products" element={<DashboardProducts />} />
          <Route path="import" element={<DashboardImport />} />
          <Route path="actions" element={<DashboardActions />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminPanel />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="tenders" element={<AdminTenders />} />
          <Route path="import" element={<AdminImport />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;