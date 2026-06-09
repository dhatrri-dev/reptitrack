import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Package, 
  CreditCard, 
  ClipboardList, 
  MapPin, 
  UserCircle,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  PlusCircle,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ logout, role }) => {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const username = localStorage.getItem('username') || 'User';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const navItems = role === 'admin' ? [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/receivers', label: 'Receivers', icon: Home },
    { path: '/tables', label: 'Shipments', icon: Package },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/reports', label: 'Reports', icon: ClipboardList },
    { path: '/track', label: 'Track', icon: MapPin },
    { path: '/admin/users', label: 'Users', icon: UserCircle },
  ] : [
    { path: '/track', label: 'Track', icon: MapPin },
    { path: '/my-shipments', label: 'My Shipments', icon: Package },
    { path: '/create-shipment', label: 'Create Shipment', icon: PlusCircle },
  ];

  return (
    <header className="glass sticky top-0 z-50 w-full" style={{ padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" title="Go to Dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>R</div>
          <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
            ReptiTrack<span style={{ color: 'var(--accent-primary)' }}>.</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '99px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Icon size={18} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={toggleTheme} 
          className="btn-icon"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {theme === 'light' ? <Moon size={20} className="text-muted" /> : <Sun size={20} className="text-main" color="var(--accent-primary)" />}
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title="User Profile & Settings"
            style={{ padding: '6px 16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{ width: '32px', height: '32px', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {username[0].toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', pointerEvents: 'none' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', lineHeight: '1' }}>{username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</div>
            </div>
            <ChevronDown size={14} className="text-muted" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="card"
                style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px', minWidth: '220px', padding: '8px', zIndex: 100, border: '1px solid var(--border-color)' }}
              >
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{localStorage.getItem('email')}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase' }}>{role} Portal</div>
                </div>
                <button 
                  onClick={logout}
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', fontWeight: '500' }}
                  className="nav-link-dropdown"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
