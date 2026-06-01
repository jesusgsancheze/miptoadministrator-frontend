import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Periods from './pages/Periods';
import Incomes from './pages/Incomes';
import Payments from './pages/Payments';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Categories from './pages/Categories';
import People from './pages/People';
import Loans from './pages/Loans';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="periods" element={<Periods />} />
        <Route path="current" element={<Navigate to="/periods" replace />} />
        <Route path="incomes" element={<Incomes />} />
        <Route path="payments" element={<Payments />} />
        <Route path="projects" element={<Projects />} />
        <Route path="clients" element={<Clients />} />
        <Route path="categories" element={<Categories />} />
        <Route path="people" element={<People />} />
        <Route path="loans" element={<Loans />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
