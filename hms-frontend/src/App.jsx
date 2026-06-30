import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for performance and code splitting
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const PatientsPage       = lazy(() => import('./pages/PatientsPage'));
const DoctorsPage        = lazy(() => import('./pages/DoctorsPage'));
const DepartmentsPage    = lazy(() => import('./pages/DepartmentsPage'));
const AppointmentsPage   = lazy(() => import('./pages/AppointmentsPage'));
const MedicalRecordsPage = lazy(() => import('./pages/MedicalRecordsPage'));
const RoomsPage          = lazy(() => import('./pages/RoomsPage'));
const BillingPage        = lazy(() => import('./pages/BillingPage'));

// Sleek loading fallback spinner
const LoadingFallback = () => (
  <div className="global-loading-overlay">
    <div className="global-loader"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/patients"       element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
            <Route path="/doctors"        element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
            <Route path="/departments"    element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
            <Route path="/appointments"   element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/medical-records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
            <Route path="/rooms"          element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
            <Route path="/billing"        element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(148,163,184,.15)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
