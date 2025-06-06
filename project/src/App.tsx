import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import RouteOptimization from './pages/RouteOptimization';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import ScenarioSimulation from './pages/ScenarioSimulation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="route-optimization" element={<RouteOptimization />} />
          <Route path="predictive-analytics" element={<PredictiveAnalytics />} />
          <Route path="scenario-simulation" element={<ScenarioSimulation />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;