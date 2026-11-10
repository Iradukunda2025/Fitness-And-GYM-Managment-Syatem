import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Common Authenticated Pages
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Disputes from './pages/Disputes';

// Member Pages
import MemberDashboard from './pages/member/MemberDashboard';
import Memberships from './pages/member/Memberships';
import Classes from './pages/member/Classes';
import WorkoutPlans from './pages/member/WorkoutPlans';
import FitnessProgress from './pages/member/FitnessProgress';
import Payments from './pages/member/Payments';

// Trainer Pages
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import AssignedMembers from './pages/trainer/AssignedMembers';
import WorkoutPlanBuilder from './pages/trainer/WorkoutPlanBuilder';
import ClassAttendance from './pages/trainer/ClassAttendance';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import MembershipPlanManager from './pages/admin/MembershipPlanManager';
import ClassManagement from './pages/admin/ClassManagement';
import Financials from './pages/admin/Financials';
import FraudAndAudit from './pages/admin/FraudAndAudit';
import Reports from './pages/admin/Reports';

// Role Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) return null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer/dashboard" replace />;
    return <Navigate to="/member/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Portal Routes (inside Dashboard Layout) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Shared Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/disputes" element={<Disputes />} />

        {/* Member Routes */}
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin']}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/memberships"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin']}>
              <Memberships />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/classes"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin']}>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/workouts"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin']}>
              <WorkoutPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/progress"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin']}>
              <FitnessProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/payments"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin']}>
              <Payments />
            </ProtectedRoute>
          }
        />

        {/* Trainer Routes */}
        <Route
          path="/trainer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['trainer', 'admin']}>
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/members"
          element={
            <ProtectedRoute allowedRoles={['trainer', 'admin']}>
              <AssignedMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/workout-builder"
          element={
            <ProtectedRoute allowedRoles={['trainer', 'admin']}>
              <WorkoutPlanBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/attendance"
          element={
            <ProtectedRoute allowedRoles={['trainer', 'admin']}>
              <ClassAttendance />
            </ProtectedRoute>
          }
        />

        {/* Administrator Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MembershipPlanManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/financials"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Financials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fraud-audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FraudAndAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              user
                ? user.role === 'admin'
                  ? '/admin/dashboard'
                  : user.role === 'trainer'
                  ? '/trainer/dashboard'
                  : '/member/dashboard'
                : '/'
            }
            replace
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
