import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Import Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Import Public Pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';

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

const PublicLayout = () => (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
        <Toaster position="top-center" richColors />
        <Header />
        <main style={{ flex: 1, paddingBottom: '4rem' }}>
            <Outlet />
        </main>
        <Footer />
    </div>
);

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Routes>
                        {/* 1. Public Routes with Header & Footer */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/products" element={<ProductListPage />} />
                            <Route path="/products/:id" element={<ProductDetailPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            } />
                            <Route path="/403" element={<ForbiddenPage />} />
                        </Route>

                        {/* 2. Admin Routes */}
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
                    </Routes>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
