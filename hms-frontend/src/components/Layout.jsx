import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, Bell, LogOut, User as UserIcon, 
  Users, Stethoscope, CalendarDays, Receipt, BedDouble, 
  FileText, LayoutDashboard, Building, Settings, AlertCircle
} from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'danger', title: 'Emergency Alert', desc: 'Ambulance arriving in 5 mins. Prep ICU bed.', time: '2 mins ago', unread: true },
  { id: 2, type: 'warning', title: 'Pending Payment', desc: 'Invoice #INV-2026-003 for John Doe is outstanding.', time: '15 mins ago', unread: true },
  { id: 3, type: 'success', title: 'Payment Received', desc: 'Successfully processed ₹12,500 from Sarah Smith.', time: '1 hour ago', unread: false },
  { id: 4, type: 'info', title: 'New Appointment', desc: 'Dr. Alok Kumar has a new booking at 4:30 PM.', time: '3 hours ago', unread: false },
];

export default function Layout({ children, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  // Close dropdown & sidebar on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        const toggleBtn = document.querySelector('.menu-toggle');
        if (toggleBtn && !toggleBtn.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/patients', icon: Users, text: 'Patients' },
    { to: '/doctors', icon: Stethoscope, text: 'Doctors' },
    { to: '/appointments', icon: CalendarDays, text: 'Appointments' },
    { to: '/billing', icon: Receipt, text: 'Billing & Invoices' },
    { to: '/rooms', icon: BedDouble, text: 'Room Allocation' },
    { to: '/records', icon: FileText, text: 'Medical Records' },
    { to: '/departments', icon: Building, text: 'Departments' },
  ];

  return (
    <div className="app-shell">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="sidebar-brand">
          <div className="sidebar-brand-icon">🏥</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Apex HMS</span>
            <span className="sidebar-brand-sub">SaaS ERP Portal</span>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Management</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-link-icon"><Icon size={18} /></span>
                <span className="nav-link-text">{item.text}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="main-content">
        {/* ─── Topbar ─────────────────────────────────────────────────────── */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(s => !s)} aria-label="Toggle Menu">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.3px', color: 'var(--text-secondary)' }}>
              {pageTitle || 'Control Center'}
            </span>
          </div>

          <div className="topbar-right">
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                className="menu-toggle" 
                style={{ display: 'block', position: 'relative' }} 
                onClick={() => setNotificationsOpen(o => !o)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent-rose)', boxShadow: '0 0 8px var(--accent-rose)'
                  }} />
                )}
              </button>
            </div>

            {/* Profile Dropdown */}
            <div ref={dropdownRef} className="profile-dropdown-container">
              <button className="profile-trigger" onClick={() => setDropdownOpen(d => !d)}>
                <div className="topbar-avatar">{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
                <div className="profile-info">
                  <span className="profile-name">{user?.username || 'Administrator'}</span>
                  <span className="profile-role">{user?.role || 'ADMIN'}</span>
                </div>
              </button>

              {dropdownOpen && (
                <div className="profile-dropdown-menu glass-panel">
                  <div className="dropdown-header">
                    <div style={{ fontWeight: 800, fontSize: '13.5px' }}>{user?.email || 'admin@apexhms.com'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Hospital ID: #APEX-1489</div>
                  </div>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/'); }}>
                    <LayoutDashboard size={14} /> Dashboard Home
                  </button>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/patients'); }}>
                    <Users size={14} /> Patient Records
                  </button>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); toast.success('Settings are managed globally'); }}>
                    <Settings size={14} /> Portal Settings
                  </button>
                  <button className="dropdown-item danger" style={{ borderTop: '1px solid var(--border)', marginTop: 6 }} onClick={handleLogout}>
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── Page Body ──────────────────────────────────────────────────── */}
        <main className="page-body">
          {children}
        </main>
      </div>

      {/* ─── Notification Drawer (Right Slide-out) ────────────────────────── */}
      <div className={`notification-drawer ${notificationsOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title"><Bell size={18} className="text-primary" /> Alerts & Reminders</div>
          <button className="drawer-close" onClick={() => setNotificationsOpen(false)} aria-label="Close Alerts">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{unreadCount} UNREAD</span>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--primary-400)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.map((n) => (
            <div key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`}>
              <span className="notification-time">{n.time}</span>
              <div className="notification-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {n.type === 'danger' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-rose)' }} />}
                {n.type === 'warning' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />}
                {n.type === 'success' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />}
                {n.type === 'info' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />}
                {n.title}
              </div>
              <p className="notification-desc">{n.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation ─────────────────────────────────────── */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <span className="mobile-nav-icon"><LayoutDashboard size={20} /></span>
          <span>Home</span>
        </Link>
        <Link to="/patients" className={`mobile-nav-link ${location.pathname === '/patients' ? 'active' : ''}`}>
          <span className="mobile-nav-icon"><Users size={20} /></span>
          <span>Patients</span>
        </Link>
        <Link to="/appointments" className={`mobile-nav-link ${location.pathname === '/appointments' ? 'active' : ''}`}>
          <span className="mobile-nav-icon"><CalendarDays size={20} /></span>
          <span>Bookings</span>
        </Link>
        <Link to="/billing" className={`mobile-nav-link ${location.pathname === '/billing' ? 'active' : ''}`}>
          <span className="mobile-nav-icon"><Receipt size={20} /></span>
          <span>Billing</span>
        </Link>
      </nav>
    </div>
  );
}
