import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { patientService }     from '../services/patientService';
import { doctorService }      from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import { billingService }     from '../services/billingService';
import { roomService }        from '../services/roomService';
import { 
  Users, Stethoscope, CalendarDays, Receipt, BedDouble, 
  TrendingUp, Activity, CheckCircle, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Stat Card Component with Micro-Glow & Hover Lift ───────────────────────
function StatCard({ icon: Icon, label, value, color, bg, border, sub, onClick }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth counter animation
  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      if (start === end) {
        setDisplayValue(end);
        return;
      }
      const duration = 1000;
      const stepTime = Math.abs(Math.floor(duration / end)) || 10;
      const timer = setInterval(() => {
        start += 1;
        setDisplayValue(start);
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [value]);

  const valString = typeof value === 'number' ? displayValue : value;

  return (
    <div 
      className="stat-card" 
      onClick={onClick}
      style={{ 
        '--stat-color': color, 
        '--stat-bg': bg,
        '--stat-border': border,
        '--stat-color-glow': bg
      }}
    >
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{valString}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div className="stat-icon"><Icon size={24} /></div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [dutyDoctors, setDutyDoctors] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [pRes, dRes, aRes, bRes, rRes] = await Promise.all([
        patientService.getAll(),
        doctorService.getAll(),
        appointmentService.getAll(),
        billingService.getAll(),
        roomService.getAll()
      ]);

      const patients     = pRes.data?.data ?? [];
      const doctors      = dRes.data?.data ?? [];
      const appointments = aRes.data?.data ?? [];
      const billing      = bRes.data?.data ?? [];
      const rooms        = rRes.data?.data ?? [];

      // 1. Calculations
      const revenue = billing.filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const occupiedRooms = rooms.filter(rm => rm.status === 'OCCUPIED').length;
      const totalRooms = rooms.length;
      const availableRooms = totalRooms - occupiedRooms;
      const rate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      setOccupancyRate(rate);

      const today = new Date().toDateString();
      const todayAppts = appointments.filter(a => {
        if (!a.appointmentDate) return false;
        return new Date(a.appointmentDate).toDateString() === today;
      }).length;

      setStats({
        patients: patients.length,
        doctors: doctors.length,
        appointments: appointments.length,
        todayAppts,
        revenue,
        availableRooms,
        totalRooms
      });

      // 2. Build Recent Activities Timeline
      const activities = [];
      patients.slice(0, 3).forEach(item => {
        activities.push({
          time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now',
          title: 'New Patient Registered',
          desc: `${item.firstName} ${item.lastName} joined the system.`,
          type: 'info'
        });
      });

      billing.slice(0, 3).forEach(item => {
        if (item.paymentStatus === 'PAID') {
          activities.push({
            time: 'Recently',
            title: 'Invoice Paid',
            desc: `Invoice ${item.invoiceNumber} of ₹${Number(item.totalAmount).toLocaleString('en-IN')} paid by ${item.patientName}.`,
            type: 'success'
          });
        }
      });

      appointments.slice(0, 3).forEach(item => {
        activities.push({
          time: item.appointmentDate ?? 'Pending',
          title: 'Appointment Scheduled',
          desc: `Patient ${item.patientName} with Dr. ${item.doctorName}.`,
          type: 'warning'
        });
      });

      // Sort activities (mix them up or sort by date)
      setRecentActivities(activities.slice(0, 5));

      // 3. Get Active Doctors
      setDutyDoctors(doctors.slice(0, 4));

    } catch (err) {
      setError(true);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const STAT_CARDS = [
    { icon: Users,        label: 'Total Patients',     value: stats.patients ?? 0,     color: '#818cf8', bg: 'rgba(129, 140, 248, 0.08)', border: 'rgba(129, 140, 248, 0.2)', sub: 'Registered patients' },
    { icon: Stethoscope,  label: 'Active Doctors',     value: stats.doctors ?? 0,      color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.2)',  sub: 'On-duty medical staff' },
    { icon: CalendarDays, label: "Today's Appointments",value: stats.todayAppts ?? 0,  color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.08)',  border: 'rgba(251, 191, 36, 0.2)',  sub: `${stats.appointments ?? 0} scheduled total` },
    { icon: Receipt,      label: 'Total Revenue',      value: stats.revenue != null ? `₹${Number(stats.revenue).toLocaleString('en-IN')}` : '₹0', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.08)', border: 'rgba(167, 139, 250, 0.2)', sub: 'From paid invoices' },
  ];

  return (
    <Layout pageTitle="Dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Hospital Control Center</h1>
          <p>Real-time metrics, analytics, and operational tracking</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        /* SKELETON LOADERS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card" style={{ height: 110, background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ width: '60%', height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                  <div style={{ width: '40%', height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                  <div style={{ width: '70%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div className="card" style={{ height: 320, background: 'rgba(255,255,255,0.02)' }} />
            <div className="card" style={{ height: 320, background: 'rgba(255,255,255,0.02)' }} />
          </div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={48} className="text-danger" />
          <h3>Error loading dashboard</h3>
          <p>We couldn't connect to the server. Check your network connection.</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* STATS COUNTERS */}
          <div className="stats-grid">
            {STAT_CARDS.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          {/* MAIN VISUALS AND CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }} className="form-row">
            {/* 1. Patient Registration Trend (Pure SVG Area Chart) */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} className="text-primary" />
                  Patient Registration Growth (Last 6 Months)
                </span>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  <svg className="chart-svg" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary-400)" />
                        <stop offset="100%" stopColor="var(--primary-600)" />
                      </linearGradient>
                      <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="500" y2="40" className="chart-grid-line" />
                    <line x1="0" y1="90" x2="500" y2="90" className="chart-grid-line" />
                    <line x1="0" y1="140" x2="500" y2="140" className="chart-grid-line" />
                    
                    {/* Area fill */}
                    <path 
                      d="M 10 170 Q 110 120, 210 100 T 410 50 L 490 30 L 490 170 Z" 
                      className="chart-path-area" 
                    />
                    
                    {/* Line path */}
                    <path 
                      d="M 10 170 Q 110 120, 210 100 T 410 50 L 490 30" 
                      className="chart-path-line" 
                    />
                    
                    {/* Data Points */}
                    <circle cx="10" cy="170" className="chart-point" />
                    <circle cx="120" cy="122" className="chart-point" />
                    <circle cx="210" cy="100" className="chart-point" />
                    <circle cx="310" cy="70" className="chart-point" />
                    <circle cx="410" cy="50" className="chart-point" />
                    <circle cx="490" cy="30" className="chart-point" />

                    {/* X-Axis labels */}
                    <text x="10" y="195" className="chart-axis-text">Jan</text>
                    <text x="120" y="195" className="chart-axis-text">Feb</text>
                    <text x="210" y="195" className="chart-axis-text">Mar</text>
                    <text x="310" y="195" className="chart-axis-text">Apr</text>
                    <text x="410" y="195" className="chart-axis-text">May</text>
                    <text x="475" y="195" className="chart-axis-text">Jun</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Occupancy Rate Circular Progress */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Room Occupancy</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
                <div style={{ position: 'relative', width: 130, height: 130 }}>
                  <svg width="130" height="130" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                    {/* Foreground Glowing Progress Circle */}
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="url(#progress-gradient)" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * occupancyRate) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--primary-400)" />
                        <stop offset="100%" stopColor="var(--accent-cyan)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'inherit'
                  }}>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>{occupancyRate}%</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Occupied</span>
                  </div>
                </div>
                <div style={{ marginTop: 20, textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>{stats.totalRooms - stats.availableRooms}</strong> of <strong>{stats.totalRooms}</strong> beds occupied.<br />
                  <span className="badge badge-success" style={{ marginTop: 8 }}>{stats.availableRooms} Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY ROW: TIMELINE & STAFF LIST */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }} className="form-row">
            {/* 1. On-Duty Doctors */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Staff On-Duty</span>
              </div>
              <div className="card-body" style={{ padding: '16px 24px' }}>
                {dutyDoctors.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <p>No doctors registered.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {dutyDoctors.map((doc) => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="topbar-avatar" style={{ width: 38, height: 38, fontSize: '14px', borderRadius: 'var(--radius-md)' }}>
                          {doc.firstName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Dr. {doc.firstName} {doc.lastName}
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} title="On Duty" />
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.specialization}</div>
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>{doc.departmentName || 'General'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Recent Activities Feed */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Activity Feed</span>
              </div>
              <div className="card-body">
                {recentActivities.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-state-icon">🔔</div>
                    <p>No recent activity detected.</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {recentActivities.map((act, i) => (
                      <div key={i} className="timeline-item">
                        <div className={`timeline-badge ${act.type}`} />
                        <div className="timeline-content">
                          <span className="timeline-time">{act.time}</span>
                          <span className="timeline-title">{act.title}</span>
                          <span className="timeline-desc">{act.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
