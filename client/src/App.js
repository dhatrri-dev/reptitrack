import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from './components/Navbar';
import TableView from './pages/TableView';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CustomerProfiles from './pages/CustomerProfiles';
import PaymentTracker from './pages/PaymentTracker';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import MyShipments from './pages/MyShipments';
import CreateShipment from './pages/CreateShipment';
import TrackingPage from './pages/TrackingPage';

// API Configuration: Inject role and customer ID headers for data isolation
axios.interceptors.request.use(config => {
  const role = localStorage.getItem('role');
  const customerId = localStorage.getItem('customerId');
  if (role) config.headers['x-user-role'] = role;
  if (customerId) config.headers['x-customer-id'] = customerId;
  return config;
}, error => {
  return Promise.reject(error);
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('auth') === 'true');
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');

  const handleLogin = (userRole) => {
    setIsLoggedIn(true);
    setRole(userRole || 'user');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('customerId');
    setIsLoggedIn(false);
    setRole('user');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-body">
        <Navbar logout={handleLogout} role={role} />
        <main style={{ padding: '64px 40px', maxWidth: '1440px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <Routes>
              {role === 'admin' ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tables" element={<TableView />} />
                  <Route path="/customers" element={<CustomerProfiles />} />
                  <Route path="/payments" element={<PaymentTracker />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/track" element={<TrackingPage />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<MyShipments />} />
                  <Route path="/track" element={<TrackingPage />} />
                  <Route path="/my-shipments" element={<MyShipments />} />
                  <Route path="/create-shipment" element={<CreateShipment />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;