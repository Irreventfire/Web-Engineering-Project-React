import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import InspectionList from './components/InspectionList';
import InspectionForm from './components/InspectionForm';
import InspectionExecution from './components/InspectionExecution';
import InspectionReport from './components/InspectionReport';
import ChecklistManagement from './components/ChecklistManagement';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="app">
        <nav className="navbar">
          <h1>Inspection Manager</h1>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Inspection Manager</h1>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/inspections" className={({ isActive }) => isActive ? 'active' : ''}>
            Inspections
          </NavLink>
          <NavLink to="/checklists" className={({ isActive }) => isActive ? 'active' : ''}>
            Checklists
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              Admin
            </NavLink>
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.username} ({user?.role})</span>
          <button className="btn btn-secondary btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inspections" element={<InspectionList />} />
          <Route path="/inspections/new" element={<InspectionForm />} />
          <Route path="/inspections/:id/edit" element={<InspectionForm />} />
          <Route path="/inspections/:id/execute" element={<InspectionExecution />} />
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
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
