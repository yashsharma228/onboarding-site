import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminClients from "./pages/AdminClients.jsx";
import AdminAddClient from "./pages/AdminAddClient.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import AdminPlans from "./pages/AdminPlans.jsx";
import AdminTerms from "./pages/AdminTerms.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

// Client Portal Pages & Components
import ClientLogin from "./pages/ClientLogin.jsx";
import ClientForgotPassword from "./pages/ClientForgotPassword.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";
import ClientProfile from "./pages/ClientProfile.jsx";
import ClientLayout from "./components/ClientLayout.jsx";

// Protected Admin Route Guard
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Client Route Guard (supports direct private link token)
const ClientProtectedRoute = ({ children }) => {
  const directToken = new URLSearchParams(window.location.search).get("token");
  if (directToken) {
    return children;
  }

  const token = sessionStorage.getItem("clientToken");
  if (!token) {
    return <Navigate to="/client/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Client Signup Route */}
      <Route path="/signup" element={<Signup />} />

      {/* Admin Authentication Routes */}
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Legacy /admin aliases redirect to clean /login */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/forgot-password" element={<Navigate to="/forgot-password" replace />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminClients />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-client"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminAddClient />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminPlans />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/terms"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminTerms />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Client Portal Authentication Routes */}
      <Route path="/client/login" element={<ClientLogin />} />
      <Route path="/client/forgot-password" element={<ClientForgotPassword />} />
      <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />

      {/* Protected Client Portal Routes */}
      <Route
        path="/client/dashboard"
        element={
          <ClientProtectedRoute>
            <ClientLayout>
              <ClientDashboard />
            </ClientLayout>
          </ClientProtectedRoute>
        }
      />
      <Route
        path="/client/profile"
        element={
          <ClientProtectedRoute>
            <ClientLayout>
              <ClientProfile />
            </ClientLayout>
          </ClientProtectedRoute>
        }
      />

      {/* Default Fallback Redirects */}
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}

export default App;
