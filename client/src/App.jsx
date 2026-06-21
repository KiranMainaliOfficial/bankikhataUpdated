import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import CustomerProfile from './pages/CustomerProfile.jsx';
import Customers from './pages/Customers.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ImportExport from './pages/ImportExport.jsx';
import Login from './pages/Login.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Transactions from './pages/Transactions.jsx';
import Users from './pages/Users.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerProfile />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="import-export" element={<ImportExport />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
