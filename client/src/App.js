import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

// Layout
import Layout from './components/Layout/Layout';
import { PasswordPromptProvider } from './contexts/PasswordPromptContext';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Main Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Journal from './pages/Journal/JournalList';
import JournalEntry from './pages/Journal/JournalEntry';
import JournalDetail from './pages/Journal/JournalDetail';
import Insights from './pages/Insights/Insights';
import TodoList from './pages/Todo/TodoList';
import BucketList from './pages/BucketList/BucketList';
import Profile from './pages/Profile/Profile';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const { theme } = useTheme();

  return (
    <div className={`app ${theme}`}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/reset-password/:token" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <PasswordPromptProvider>
              <Layout />
            </PasswordPromptProvider>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="journal" element={<Journal />} />
          <Route path="journal/new" element={<JournalEntry />} />
          <Route path="journal/:id" element={<JournalDetail />} />
          <Route path="journal/:id/edit" element={<JournalEntry />} />
          <Route path="insights" element={<Insights />} />
          <Route path="todo" element={<TodoList />} />
          <Route path="bucket-list" element={<BucketList />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
