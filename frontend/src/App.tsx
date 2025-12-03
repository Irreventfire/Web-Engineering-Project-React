import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

import Dashboard from './components/Dashboard';
import InspectionList from './components/InspectionList';
import InspectionForm from './components/InspectionForm';
import InspectionExecution from './components/InspectionExecution';
import InspectionReport from './components/InspectionReport';
import ChecklistManagement from './components/ChecklistManagement';

function App() {
  return (
    <Router>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
