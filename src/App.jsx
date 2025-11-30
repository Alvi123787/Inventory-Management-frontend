import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductHistory from "./pages/ProductHistory";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import ShowAllProducts from "./components/ShowAllProducts";
import ShowAllOrders from "./components/ShowAllOrders";
import TaxDiscountSettings from "./pages/TaxDiscountSettings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
// Integrations page removed
import Expenses from "./pages/Expenses";

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const token = localStorage.getItem("token");

  return (
    <>
      {/* Only show Navbar if user is authenticated and not on login page */}
      {token && !isLoginPage && <Navbar />}
      <div className={`container ${token && !isLoginPage ? 'mt-4' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute featureRequired="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute featureRequired="products">
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/history"
            element={
              <ProtectedRoute featureRequired="products">
                <ProductHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute featureRequired="orders">
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute featureRequired="reports">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/showproducts"
            element={
              <ProtectedRoute featureRequired="products">
                <ShowAllProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/showorders"
            element={
              <ProtectedRoute featureRequired="orders">
                <ShowAllOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute roleRequired="admin">
                <Register />
              </ProtectedRoute>
            }
          />
          {/* Integrations route removed */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute featureRequired="settings">
                <TaxDiscountSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute featureRequired="expenses">
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute roleRequired={["admin","sub_admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
