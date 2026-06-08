import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
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

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setRole('user');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, customer_id')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        setRole(data.role || 'user');
        localStorage.setItem('customerId', data.customer_id || '');
        localStorage.setItem('role', data.role || 'user');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('customerId');
    localStorage.removeItem('role');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
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
                  <Route path="/create-shipment" element={<CreateShipment />} />
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