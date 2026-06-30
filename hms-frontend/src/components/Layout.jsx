import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, Building2,
  CalendarDays, FileText, BedDouble, Receipt, LogOut, Hospital, Menu, X, ChevronDown, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { label: 'Overview',    group: 'MAIN' },
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },

  { label: 'Management',  group: 'MANAGEMENT' },
  { to: '/patients',      icon: Users,          label: 'Patients'          },
  { to: '/doctors',       icon: Stethoscope,    label: 'Doctors'           },
  { to: '/departments',   icon: Building2,      label: 'Departments'       },
  { to: '/appointments',  icon: CalendarDays,   label: 'Appointments'      },

  { label: 'Records',     group: 'RECORDS' },
  { to: '/medical-records', icon: FileText,     label: 'Medical Records'   },
  { to: '/rooms',         icon: BedDouble,      label: 'Rooms'             },
  { to: '/billing',       icon: Receipt,        label: 'Billing'           },
];

export default function Layout({ children, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="app-shell">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 99, background: 'rgba(0,0,0,0.5)' }} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Hospital size={20} color="#fff" /></div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Apex HMS</span>
            <span className="sidebar-brand-sub">Hospital Management</span>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            style={{ marginLeft: 'auto', border: 'none', background: 'none', display: 'none' }}
            onClick={() => setIsSidebarOpen(false)}
            id="close-sidebar-mobile"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.group) {
              return <div key={i} className="sidebar-section-label">{item.label}</div>;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-link-icon"><Icon size={17} /></span>
                <span className="nav-link-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-link w-full logout-btn" 
            style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }} 
            onClick={handleLogout}
          >
            <span className="nav-link-icon"><LogOut size={17} /></span>
            <span className="nav-link-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="main-content">
        <header className="topbar">
          <button 
            className="btn btn-secondary btn-icon" 
            style={{ display: 'none', padding: '6px' }} 
            onClick={() => setIsSidebarOpen(true)}
            id="menu-toggle-mobile"
          >
            <Menu size={20} />
          </button>

          <h2 className="topbar-title">{pageTitle}</h2>

          {/* User Dropdown */}
          <div className="topbar-user-wrapper" ref={dropdownRef}>
            <div className="topbar-user" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="topbar-avatar">
                {user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="topbar-username">{user?.username || 'Admin'}</span>
                <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 6px', marginTop: '2px' }}>
                  {user?.role || 'ADMIN'}
                </span>
              </div>
              <ChevronDown size={14} style={{ opacity: 0.7, marginLeft: 4 }} />
            </div>

            {isDropdownOpen && (
              <div className="topbar-dropdown">
                <div className="dropdown-header">
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{user?.username}</div>
                  <div className="dropdown-email">{user?.email || 'admin@hms.com'}</div>
                </div>
                <div className="dropdown-item" style={{ cursor: 'default' }}>
                  <User size={14} />
                  <span>My Profile</span>
                </div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>
        
        <main className="page-body">{children}</main>
      </div>

      {/* Responsive Sidebar CSS overrides */}
      <style>{`
        @media (max-width: 768px) {
          #menu-toggle-mobile { display: inline-flex !important; }
          #close-sidebar-mobile { display: inline-flex !important; }
          .sidebar {
            transform: translateX(-100%);
            width: 260px !important;
          }
          .sidebar.open {
            transform: translateX(0);
            box-shadow: 5px 0 25px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </div>
  );
}
