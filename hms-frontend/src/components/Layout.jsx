import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, Building2,
  CalendarDays, FileText, BedDouble, Receipt, LogOut, Hospital
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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Hospital size={20} color="#fff" /></div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Apex HMS</span>
            <span className="sidebar-brand-sub">Hospital Management</span>
          </div>
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
              >
                <span className="nav-link-icon"><Icon size={17} /></span>
                <span className="nav-link-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link w-full" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={handleLogout}>
            <span className="nav-link-icon"><LogOut size={17} /></span>
            <span className="nav-link-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{pageTitle}</h2>
          <div className="topbar-user">
            <div className="topbar-avatar">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="topbar-username">{user?.username}</div>
              <div className="topbar-role">{user?.role}</div>
            </div>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
