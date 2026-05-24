import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WeeklySchedule from './pages/WeeklySchedule';
import FreeRooms from './pages/FreeRooms';
import Upload from './pages/Upload';
import Profile from './pages/Profile';

// Protected Route Wrapper Component
function ProtectedRoute({ children }) {
  const token = useStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

// Redirect helper if already authenticated
function AuthRoute({ children }) {
  const token = useStore((state) => state.token);
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default function App() {
  const token = useStore((state) => state.token);
  const fetchCurrentSchedule = useStore((state) => state.fetchCurrentSchedule);
  const themeMode = useStore((state) => state.themeMode);

  React.useEffect(() => {
    if (token && token !== 'mock-jwt-session-token') {
      fetchCurrentSchedule();
    }
  }, [token, fetchCurrentSchedule]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [themeMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public/Authentication Routes */}
        <Route 
          path="/login" 
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          } 
        />

        {/* Protected Dashboard/Timetable Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <WeeklySchedule />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/free-rooms" 
          element={
            <ProtectedRoute>
              <FreeRooms />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
