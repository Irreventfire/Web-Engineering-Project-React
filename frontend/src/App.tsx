import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Dashboard from './components/Dashboard';
import InspectionList from './components/InspectionList';
import InspectionForm from './components/InspectionForm';
import InspectionExecution from './components/InspectionExecution';
import InspectionReport from './components/InspectionReport';
import ChecklistManagement from './components/ChecklistManagement';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  if (!isAuthenticated) {
    return (
      <div className="app">
        <nav className="navbar">
          <h1>{t('inspectionManager')}</h1>
          <div className="language-switcher">
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}>
              <option value="de">{t('german')}</option>
              <option value="en">{t('english')}</option>
            </select>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>{t('inspectionManager')}</h1>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('dashboard')}
          </NavLink>
          <NavLink to="/inspections" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('inspections')}
          </NavLink>
          <NavLink to="/checklists" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('checklists')}
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('admin')}
            </NavLink>
          )}
        </div>
        <div className="user-info">
          <div className="language-switcher">
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}>
              <option value="de">{t('german')}</option>
              <option value="en">{t('english')}</option>
            </select>
          </div>
          <span className="user-name">{user?.username} ({user?.role})</span>
          <button className="btn btn-secondary btn-logout" onClick={logout}>
            {t('logout')}
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inspections" element={<InspectionList />} />
          <Route 
            path="/inspections/new" 
            element={
              <ProtectedRoute requiredRole={UserRole.USER}>
                <InspectionForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inspections/:id/edit" 
            element={
              <ProtectedRoute requiredRole={UserRole.USER}>
                <InspectionForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inspections/:id/execute" 
            element={
              <ProtectedRoute requiredRole={UserRole.USER}>
                <InspectionExecution />
              </ProtectedRoute>
            } 
          />
          <Route path="/inspections/:id/report" element={<InspectionReport />} />
          <Route path="/checklists" element={<ChecklistManagement />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
