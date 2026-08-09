import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Import Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Import Public Pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import NewsPage from './pages/NewsPage';
import ForbiddenPage from './pages/ForbiddenPage';
import WishlistPage from './pages/WishlistPage';

// Import Layouts
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import ShipperLayout from './layouts/ShipperLayout';

// Import Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductManagePage from './pages/admin/ProductManagePage';
import OrderManagePage from './pages/admin/OrderManagePage';
import UserManagePage from './pages/admin/UserManagePage';
import CouponManagePage from './pages/admin/CouponManagePage';
import ReturnManagePage from './pages/admin/ReturnManagePage';
import InventoryManagePage from './pages/admin/InventoryManagePage';
import BannerManagePage from './pages/admin/BannerManagePage';
import ReviewManagePage from './pages/admin/ReviewManagePage';
import ShippingConfigPage from './pages/admin/ShippingConfigPage';

const PublicLayout = () => (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, paddingBottom: '4rem' }}>
            <Outlet />
        </main>
        <Footer />
    </div>
);

import { GoogleOAuthProvider } from '@react-oauth/google';

// ... (other providers)
function App() {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-mockedclientid.apps.googleusercontent.com';

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <Router>
                            <ScrollToTop />
                            <Toaster position="top-center" richColors />
                            <Routes>
                                {/* 1. Public Routes with Header & Footer */}
                                <Route element={<PublicLayout />}>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/news" element={<NewsPage />} />
                                    <Route path="/products" element={<ProductListPage />} />
                                    <Route path="/products/:id" element={<ProductDetailPage />} />
                                    <Route path="/cart" element={<CartPage />} />
                                    <Route path="/wishlist" element={<WishlistPage />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/verify-otp" element={<VerifyOtpPage />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                                    <Route path="/profile" element={
                                        <ProtectedRoute>
                                            <ProfilePage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/403" element={<ForbiddenPage />} />
                                </Route>


                                <Route path="/admin" element={
                                    <ProtectedRoute roles={['admin']}>
                                        <AdminLayout />
                                    </ProtectedRoute>
                                }>
                                    <Route index element={<DashboardPage />} />
                                    <Route path="products" element={<ProductManagePage />} />
                                    <Route path="orders" element={<OrderManagePage />} />
                                    <Route path="users" element={<UserManagePage />} />
                                    <Route path="coupons" element={<CouponManagePage />} />
                                    <Route path="returns" element={<ReturnManagePage />} />
                                    <Route path="inventory" element={<InventoryManagePage />} />
                                    <Route path="banners" element={<BannerManagePage />} />
                                    <Route path="reviews" element={<ReviewManagePage />} />
                                    <Route path="shipping" element={<ShippingConfigPage />} />
                                </Route>

                                {/* 3. Staff Routes */}
                                <Route path="/staff" element={
                                    <ProtectedRoute roles={['staff']}>
                                        <StaffLayout />
                                    </ProtectedRoute>
                                }>
                                    <Route index element={<DashboardPage />} />
                                    <Route path="products" element={<ProductManagePage />} />
                                    <Route path="orders" element={<OrderManagePage />} />
                                    <Route path="inventory" element={<InventoryManagePage />} />
                                </Route>

                                {/* 4. Shipper Routes */}
                                <Route path="/shipper" element={
                                    <ProtectedRoute roles={['shipper']}>
                                        <ShipperLayout />
                                    </ProtectedRoute>
                                }>
                                    <Route index element={<OrderManagePage />} />
                                </Route>
                                {/* Add a catch-all 404 route if needed */}
                            </Routes>
                        </Router>
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
