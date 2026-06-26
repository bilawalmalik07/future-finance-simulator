import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import BudgetPage from './Budgetpage';

function App() {
  return (
    <Router>
      <Routes>
        {/* This makes AuthPage the default landing screen */}
        <Route path="/" element={<AuthPage />} />
        
        {/* Once logged in, these paths will map to your other pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budget" element={<BudgetPage />} />
        
        {/* Catch-all fallback route back to AuthPage if a path doesn't exist */}
        <Route path="*" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;