import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeAuth, fetchUserProfile } from './store/slices/authSlice';

// Layout components
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

// Pages
import Home from './pages/Home';
import CompanyCard from './pages/CompanyCard';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Category from './pages/Category';
import Tenders from './pages/Tenders';
import TenderDetail from './pages/TenderDetail';
import Suppliers from './pages/Suppliers';
import Actions from './pages/Actions';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import HelpPage from './pages/Help';
import ContactPage from './pages/Contact';
import PrivacyPage from './pages/Privacy';
import AboutPage from './pages/About';
import PricingPage from './pages/Pricing';

// Dashboard pages
import SupplierDashboard from './pages/SupplierDashboard';
import DashboardCompany from './pages/SupplierDashboard/Company';
import DashboardProducts from './pages/SupplierDashboard/Products';
import DashboardImport from './pages/SupplierDashboard/Import';
import DashboardActions from './pages/SupplierDashboard/Actions';
import CreateAction from './pages/SupplierDashboard/CreateAction';
import EditAction from './pages/SupplierDashboard/EditAction';
import DashboardSettings from './pages/SupplierDashboard/Settings';
import DashboardReviews from './pages/SupplierDashboard/Reviews';
import CreateTender from './pages/SupplierDashboard/CreateTender';
import EditTender from './pages/SupplierDashboard/EditTender';
import CreateProduct from './pages/SupplierDashboard/CreateProduct';
import EditProduct from './pages/SupplierDashboard/EditProduct';
import DashboardTenders from './pages/SupplierDashboard/Tenders';

// Admin pages
import AdminPanel from './pages/AdminPanel';
import AdminModeration from './pages/AdminPanel/Moderation';
import AdminCategories from './pages/AdminPanel/Categories';
import AdminReviews from './pages/AdminPanel/Reviews';
import AdminTenders from './pages/AdminPanel/Tenders';
import CreateEditTender from './pages/AdminPanel/CreateEditTender';
import AdminImport from './pages/AdminPanel/Import';

// Protected route components
import ProtectedRoute from './components/ProtectedRoute';
import DiagnosticPage from './DiagnosticPage';
import MapTest from './pages/MapTest';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken, user } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Load user profile if authenticated but user data is missing
  useEffect(() => {
    if (isAuthenticated && accessToken && !user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, accessToken, user]);

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="tenders" element={<Tenders />} />
          <Route path="tenders/:id" element={<TenderDetail />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="actions" element={<Actions />} />
          <Route path="company/:id" element={<CompanyCard />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="category/:slug" element={<Category />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="help/pricing" element={<PricingPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Supplier Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="ROLE_SUPPLIER">
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SupplierDashboard />} />
          <Route path="company" element={<DashboardCompany />} />
          <Route path="company/:companyId" element={<DashboardCompany />} />
          <Route path="products" element={<DashboardProducts />} />
          <Route path="products/create" element={<CreateProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="reviews" element={<DashboardReviews />} />
          <Route path="import" element={<DashboardImport />} />
          <Route path="actions" element={<DashboardActions />} />
          <Route path="actions/create" element={<CreateAction />} />
          <Route path="actions/edit/:id" element={<EditAction />} />
          <Route path="tenders" element={<DashboardTenders />} />
          <Route path="tenders/create" element={<CreateTender />} />
          <Route path="tenders/edit/:id" element={<EditTender />} />
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
          <Route path="tenders/create" element={<CreateEditTender />} />
          <Route path="tenders/:id/edit" element={<CreateEditTender />} />
          <Route path="import" element={<AdminImport />} />
        </Route>

        {/* Diagnostic page for development */}
        <Route path="/diagnostic" element={<DiagnosticPage />} />

        {/* Map test page for development */}
        <Route path="/map-test" element={<MapTest />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;