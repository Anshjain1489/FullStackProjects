import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { appointmentService } from '../services/appointmentService';
import { patientService }     from '../services/patientService';
import { doctorService }      from '../services/doctorService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'];
const EMPTY = { patientId:'', doctorId:'', appointmentDate:'', notes:'', status:'SCHEDULED' };

const statusBadge = (s) => {
  const map = { SCHEDULED:'badge-info', CONFIRMED:'badge-primary', COMPLETED:'badge-success', CANCELLED:'badge-danger', NO_SHOW:'badge-warning' };
  return map[s] || 'badge-muted';
};

export default function AppointmentsPage() {
  const [apts, setApts]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [modal, setModal]      = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]  = useState({ open:false, id:null });
  const [saving, setSaving]    = useState(false);
  const [form, setForm]        = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, pr, dr] = await Promise.all([
        appointmentService.getAll(), patientService.getAll(), doctorService.getAll()
      ]);
      const data = ar.data?.data ?? [];
      setApts(data); setFiltered(data);
      setPatients(pr.data?.data ?? []);
      setDoctors(dr.data?.data ?? []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(apts.filter(a =>
      `${a.patient?.firstName} ${a.patient?.lastName}`.toLowerCase().includes(q) ||
      `${a.doctor?.firstName} ${a.doctor?.lastName}`.toLowerCase().includes(q)
    ));
  }, [search, apts]);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (a) => {
    setForm({
      patientId: a.patient?.id ?? '',
      doctorId:  a.doctor?.id  ?? '',
      appointmentDate: a.appointmentDate ? a.appointmentDate.slice(0,16) : '',
      notes: a.notes ?? '',
      status: a.status ?? 'SCHEDULED'
    });
    setModal({ open:true, mode:'edit', data:a });
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.patientId || !form.doctorId || !form.appointmentDate) { toast.error('Patient, doctor and date are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, patientId: Number(form.patientId), doctorId: Number(form.doctorId) };
      if (modal.mode==='add') await appointmentService.create(payload);
      else await appointmentService.update(modal.data.id, payload);
      toast.success(`Appointment ${modal.mode==='add'?'scheduled':'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await appointmentService.delete(confirm.id); toast.success('Appointment deleted'); setConfirm({open:false,id:null}); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <Layout pageTitle="Appointments">
      <div className="page-header">
        <div className="page-header-left"><h1>Appointments</h1><p>{filtered.length} appointment{filtered.length!==1?'s':''}</p></div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box"><span className="search-icon"><Search size={15}/></span><input placeholder="Search by patient or doctor…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button id="add-appointment-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Schedule</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading…</div>
        : filtered.length===0 ? <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No appointments found</h3><p>Schedule a new appointment</p></div>
        : (
          <div className="table-wrapper"><table>
            <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((a,i) => (
              <tr key={a.id}>
                <td className="td-muted">{i+1}</td>
                <td><strong>{a.patient?.firstName} {a.patient?.lastName}</strong></td>
                <td>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                <td className="td-muted">{a.appointmentDate ? new Date(a.appointmentDate).toLocaleString() : '—'}</td>
                <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                <td className="td-muted truncate" style={{maxWidth:150}}>{a.notes||'—'}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(a)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:a.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'📅 Schedule Appointment':'✏️ Edit Appointment'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Patient *</label>
            <select className="form-control" name="patientId" value={form.patientId} onChange={handleChange}>
              <option value="">— Select Patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Doctor *</label>
            <select className="form-control" name="doctorId" value={form.doctorId} onChange={handleChange}>
              <option value="">— Select Doctor —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date & Time *</label><input className="form-control" type="datetime-local" name="appointmentDate" value={form.appointmentDate} onChange={handleChange}/></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleChange}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Reason for visit…" rows={3} style={{resize:'vertical'}}/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Appointment"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Delete this appointment record?</p>
      </Modal>
    </Layout>
  );
}
