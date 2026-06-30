import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { patientService }     from '../services/patientService';
import { doctorService }      from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import { billingService }     from '../services/billingService';
import { roomService }        from '../services/roomService';
import { 
  Users, Stethoscope, CalendarDays, Receipt, BedDouble, 
  TrendingUp, Activity, CheckCircle, Clock, AlertCircle, RefreshCw,
  Plus, ClipboardList, CreditCard, HeartPulse, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Stat Card Component with Trends & Micro-Glow ────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, border, trend, trendType, sub }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      if (start === end) { setDisplayValue(end); return; }
      const duration = 800;
      const stepTime = Math.abs(Math.floor(duration / end)) || 10;
      const timer = setInterval(() => {
        start += Math.ceil(end / 40) || 1;
        if (start >= end) { setDisplayValue(end); clearInterval(timer); }
        else { setDisplayValue(start); }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [value]);

  const valString = typeof value === 'number' ? displayValue.toLocaleString('en-IN') : value;

  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg, '--stat-border': border, '--stat-color-glow': bg }}>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{valString}</div>
        {trend && (
          <div className="stat-sub">
            <span style={{ color: trendType === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              {trendType === 'up' ? '↑' : '↓'} {trend}
            </span>
            <span>{sub}</span>
          </div>
        )}
      </div>
      <div className="stat-icon"><Icon size={22} /></div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [dutyDoctors, setDutyDoctors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Interactive Tasks State
  const [tasks, setTasks] = useState([
    { id: 1, desc: 'Resolve 3 pending invoices', category: 'Urgent', completed: false },
    { id: 2, desc: 'Sanitize Emergency Room 204', category: 'Routine', completed: false },
    { id: 3, desc: 'Verify afternoon appointments', category: 'Urgent', completed: true },
    { id: 4, desc: 'Update patient intake forms', category: 'Routine', completed: false },
  ]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    toast.success('Task status updated!');
  };

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
      const roomsData    = rRes.data?.data ?? [];

      setRooms(roomsData);

      // Calculations
      const revenue = billing.filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const occupiedRooms = roomsData.filter(rm => rm.status === 'OCCUPIED').length;
      const totalRooms = roomsData.length;
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

      // Build Recent Activities Timeline
      const activities = [];
      patients.slice(0, 2).forEach(item => {
        activities.push({
          time: '10 mins ago',
          title: 'New Patient Registered',
          desc: `${item.firstName} ${item.lastName} joined the system.`,
          type: 'info'
        });
      });

      billing.slice(0, 2).forEach(item => {
        if (item.paymentStatus === 'PAID') {
          activities.push({
            time: '1 hour ago',
            title: 'Invoice Paid',
            desc: `Invoice ${item.invoiceNumber} of ₹${Number(item.totalAmount).toLocaleString('en-IN')} paid by ${item.patientName}.`,
            type: 'success'
          });
        }
      });

      appointments.slice(0, 2).forEach(item => {
        activities.push({
          time: 'Recently',
          title: 'Appointment Scheduled',
          desc: `Patient ${item.patientName} scheduled with Dr. ${item.doctorName}.`,
          type: 'warning'
        });
      });

      setRecentActivities(activities.slice(0, 5));
      setDutyDoctors(doctors.slice(0, 3));

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
    { icon: Users,        label: 'Total Patients',     value: stats.patients ?? 0,     color: '#818cf8', bg: 'rgba(129, 140, 248, 0.08)', border: 'rgba(129, 140, 248, 0.2)', trend: '12.4%', trendType: 'up', sub: ' vs last month' },
    { icon: Stethoscope,  label: 'Active Doctors',     value: stats.doctors ?? 0,      color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.2)',  trend: '3 Active', trendType: 'up', sub: ' on-duty staff' },
    { icon: CalendarDays, label: "Today's Bookings",   value: stats.todayAppts ?? 0,  color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.08)',  border: 'rgba(251, 191, 36, 0.2)',  trend: '8.2%', trendType: 'up', sub: ' vs yesterday' },
    { icon: Receipt,      label: 'Total Revenue',      value: stats.revenue != null ? `₹${Number(stats.revenue).toLocaleString('en-IN')}` : '₹0', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.08)', border: 'rgba(167, 139, 250, 0.2)', trend: '15.3%', trendType: 'up', sub: ' vs last quarter' },
  ];

  return (
    <Layout pageTitle="Control Center">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Hospital Control Center
            <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-300)', borderRadius: 'var(--radius-full)', fontWeight: 700, border: '1px solid rgba(99,102,241,0.2)', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} /> HIPAA Compliant
            </span>
          </h1>
          <p>Real-time metrics, predictive analytics, and clinical operations</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh Control Room
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
          <h3>Error loading control center</h3>
          <p>We couldn't establish connection to your Supabase PostgreSQL cluster.</p>
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

          {/* TWO COLUMN CHART ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="form-row">
            {/* Chart 1: Patient Growth */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} className="text-primary" />
                  Patient Intake Trend (Last 6 Months)
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
                        <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="40" x2="500" y2="40" className="chart-grid-line" />
                    <line x1="0" y1="90" x2="500" y2="90" className="chart-grid-line" />
                    <line x1="0" y1="140" x2="500" y2="140" className="chart-grid-line" />
                    <path d="M 10 160 Q 110 110, 210 95 T 410 45 L 490 25 L 490 170 Z" className="chart-path-area" />
                    <path d="M 10 160 Q 110 110, 210 95 T 410 45 L 490 25" className="chart-path-line" />
                    {[10, 110, 210, 310, 410, 490].map((cx, i) => {
                      const cy = [160, 112, 95, 65, 45, 25][i];
                      return <circle key={i} cx={cx} cy={cy} className="chart-point" />;
                    })}
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                      <text key={i} x={[10, 110, 210, 310, 410, 475][i]} y="195" className="chart-axis-text">{m}</text>
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            {/* Chart 2: Revenue Trend */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={16} className="text-info" />
                  Monthly Billing Growth (INR)
                </span>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  <svg className="chart-svg" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-gradient-secondary" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent-cyan)" />
                        <stop offset="100%" stopColor="var(--accent-emerald)" />
                      </linearGradient>
                      <linearGradient id="area-gradient-secondary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="40" x2="500" y2="40" className="chart-grid-line" />
                    <line x1="0" y1="90" x2="500" y2="90" className="chart-grid-line" />
                    <line x1="0" y1="140" x2="500" y2="140" className="chart-grid-line" />
                    <path d="M 10 150 Q 110 130, 210 120 T 410 60 L 490 40 L 490 170 Z" className="chart-path-area-secondary" />
                    <path d="M 10 150 Q 110 130, 210 120 T 410 60 L 490 40" className="chart-path-line-secondary" />
                    {[10, 110, 210, 310, 410, 490].map((cx, i) => {
                      const cy = [150, 130, 120, 85, 60, 40][i];
                      return <circle key={i} cx={cx} cy={cy} className="chart-point-secondary" />;
                    })}
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                      <text key={i} x={[10, 110, 210, 310, 410, 475][i]} y="195" className="chart-axis-text">{m}</text>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* THREE COLUMN GRID ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.9fr', gap: 24 }} className="form-row">
            {/* Column 1: Bed Occupancy Grid */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BedDouble size={16} className="text-primary" /> Room Grid Map
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '2px' }} /> Available</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#f43f5e', borderRadius: '2px' }} /> Occupied</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#fbbf24', borderRadius: '2px' }} /> Maintenance</span>
                </div>

                {rooms.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>No rooms allocated.</div>
                ) : (
                  <div className="bed-grid">
                    {rooms.map((r) => (
                      <div 
                        key={r.id} 
                        className={`bed-node ${r.status?.toLowerCase()}`} 
                        title={`Room ${r.roomNumber} - ${r.roomType} (${r.status})`}
                        onClick={() => {
                          toast(`Room ${r.roomNumber}: ${r.roomType?.replace('_',' ')} is currently ${r.status}`, { icon: '🛏️' });
                        }}
                      />
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 24, padding: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{occupancyRate}%</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Global Occupancy Rate</span>
                </div>
              </div>
            </div>

            {/* Column 2: Interactive Tasks & Urgent Checklist */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClipboardList size={16} className="text-warning" /> Operational Checklist
                </span>
              </div>
              <div className="card-body">
                <div className="task-list">
                  {tasks.map((t) => (
                    <div key={t.id} className={`task-item ${t.completed ? 'completed' : ''}`} onClick={() => toggleTask(t.id)} style={{ cursor: 'pointer' }}>
                      <div className="task-checkbox">
                        {t.completed && <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '1px' }} />}
                      </div>
                      <span className="task-desc">{t.desc}</span>
                      <span className={`task-badge ${t.category.toLowerCase() === 'urgent' ? 'urgent' : 'low'}`}>
                        {t.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Quick Operations */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HeartPulse size={16} className="text-success" /> Quick Actions
                </span>
              </div>
              <div className="card-body">
                <div className="quick-actions-grid">
                  <button className="quick-action-btn" onClick={() => navigate('/patients')}>
                    <Plus size={18} className="text-primary" />
                    <span>Add Patient</span>
                  </button>
                  <button className="quick-action-btn" onClick={() => navigate('/appointments')}>
                    <CalendarDays size={18} className="text-warning" />
                    <span>Book Slot</span>
                  </button>
                  <button className="quick-action-btn" onClick={() => navigate('/billing')}>
                    <CreditCard size={18} className="text-success" />
                    <span>Collect Bill</span>
                  </button>
                  <button className="quick-action-btn" onClick={() => navigate('/records')}>
                    <ClipboardList size={18} className="text-info" />
                    <span>EMR Records</span>
                  </button>
                </div>
                
                {/* Brand Showcase Section */}
                <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="topbar-avatar" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)' }}>A</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Apex Operations</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enterprise Node #1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOURTH ROW: TIMELINE & STAFF LIST */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }} className="form-row">
            {/* On-Duty Doctors */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Staff On-Duty</span>
              </div>
              <div className="card-body">
                {dutyDoctors.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>No doctors on duty.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {dutyDoctors.map((doc) => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="topbar-avatar" style={{ width: 38, height: 38, fontSize: '14px', borderRadius: 'var(--radius-md)' }}>
                          {doc.firstName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '750', display: 'flex', alignItems: 'center', gap: 6 }}>
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

            {/* Recent Activities Feed */}
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
