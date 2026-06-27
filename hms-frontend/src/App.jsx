import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import DashboardPage     from './pages/DashboardPage';
import PatientsPage      from './pages/PatientsPage';
import DoctorsPage       from './pages/DoctorsPage';
import DepartmentsPage   from './pages/DepartmentsPage';
import AppointmentsPage  from './pages/AppointmentsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import RoomsPage         from './pages/RoomsPage';
import BillingPage       from './pages/BillingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
