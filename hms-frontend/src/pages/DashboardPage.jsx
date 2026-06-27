import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { patientService }     from '../services/patientService';
import { doctorService }      from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import { billingService }     from '../services/billingService';
import { roomService }        from '../services/roomService';
import { Users, Stethoscope, CalendarDays, Receipt, BedDouble, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-icon"><Icon size={22} color="#fff" /></div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? <span className="spinner" style={{ border: '2px solid rgba(255,255,255,.2)', borderTopColor: color }} />}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      patientService.getAll(),
      doctorService.getAll(),
      appointmentService.getAll(),
      billingService.getAll(),
      roomService.getAll(),
    ]).then(([p, d, a, b, r]) => {
      const patients     = p.status === 'fulfilled' ? p.value.data?.data ?? [] : [];
      const doctors      = d.status === 'fulfilled' ? d.value.data?.data ?? [] : [];
      const appointments = a.status === 'fulfilled' ? a.value.data?.data ?? [] : [];
      const billing      = b.status === 'fulfilled' ? b.value.data?.data ?? [] : [];
      const rooms        = r.status === 'fulfilled' ? r.value.data?.data ?? [] : [];

      const revenue = billing.filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const availableRooms = rooms.filter(rm => rm.status === 'AVAILABLE').length;
      const todayAppts = appointments.filter(a => {
        const d = new Date(a.appointmentDate);
        const t = new Date();
        return d.toDateString() === t.toDateString();
      }).length;

      setStats({ patients: patients.length, doctors: doctors.length,
        appointments: appointments.length, todayAppts, revenue, availableRooms, totalRooms: rooms.length });
      setLoading(false);
    });
  }, []);

  const STAT_CARDS = [
    { icon: Users,        label: 'Total Patients',     value: stats.patients,     color: '#3b82f6', bg: 'rgba(59,130,246,.2)',  sub: 'Registered patients' },
    { icon: Stethoscope,  label: 'Active Doctors',     value: stats.doctors,      color: '#10b981', bg: 'rgba(16,185,129,.2)',  sub: 'Medical staff' },
    { icon: CalendarDays, label: "Today's Appointments",value: stats.todayAppts,  color: '#f59e0b', bg: 'rgba(245,158,11,.2)',  sub: `${stats.appointments ?? '—'} total` },
    { icon: Receipt,      label: 'Revenue (Paid)',      value: stats.revenue != null ? `₹${Number(stats.revenue).toLocaleString('en-IN')}` : undefined, color: '#8b5cf6', bg: 'rgba(139,92,246,.2)', sub: 'From paid invoices' },
    { icon: BedDouble,    label: 'Available Rooms',     value: stats.availableRooms, color: '#06b6d4', bg: 'rgba(6,182,212,.2)', sub: `of ${stats.totalRooms ?? '—'} total` },
    { icon: TrendingUp,   label: 'Total Appointments',  value: stats.appointments, color: '#ef4444', bg: 'rgba(239,68,68,.2)',  sub: 'All time' },
  ];

  return (
    <Layout pageTitle="Dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Hospital Overview</h1>
          <p>Real-time summary of Apex Hospital operations</p>
        </div>
      </div>

      {loading ? (
        <div className="spinner-page"><div className="spinner" />Loading dashboard…</div>
      ) : (
        <>
          <div className="stats-grid">
            {STAT_CARDS.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">🏥 Apex Hospital Management System</span>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Welcome to <strong style={{ color: 'var(--text-primary)' }}>Apex HMS</strong> — your comprehensive hospital
                management platform. Use the sidebar to navigate between modules: manage patient records, schedule
                appointments with doctors, track medical records, handle room allocations, and process billing invoices —
                all from one unified dashboard.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[['Patients', '/patients'], ['Doctors', '/doctors'], ['Appointments', '/appointments'], ['Billing', '/billing']].map(([label, href]) => (
                  <a key={href} href={href} className="btn btn-secondary btn-sm">{label} →</a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
