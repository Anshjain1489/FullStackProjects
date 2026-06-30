import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { appointmentService } from '../services/appointmentService';
import { patientService }     from '../services/patientService';
import { doctorService }      from '../services/doctorService';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'];
const EMPTY = { patientId:'', doctorId:'', appointmentDate:'', appointmentTime:'', reason:'', notes:'', status:'SCHEDULED' };

const statusBadge = (s) => {
  const map = { SCHEDULED:'badge-info', CONFIRMED:'badge-primary', COMPLETED:'badge-success', CANCELLED:'badge-danger', NO_SHOW:'badge-warning' };
  return map[s] || 'badge-muted';
};

export default function AppointmentsPage() {
  const [apts, setApts]       = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [modal, setModal]      = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]  = useState({ open:false, id:null });
  const [saving, setSaving]    = useState(false);
  const [form, setForm]        = useState(EMPTY);
  
  // Validation State
  const [errors, setErrors]    = useState({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'appointmentDate', direction: 'desc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, pr, dr] = await Promise.all([
        appointmentService.getAll(), patientService.getAll(), doctorService.getAll()
      ]);
      const data = ar.data?.data ?? [];
      setApts(data);
      setPatients(pr.data?.data ?? []);
      setDoctors(dr.data?.data ?? []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Request Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort Appointments
  const processedApts = useMemo(() => {
    let result = [...apts];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.patientName?.toLowerCase().includes(q) ||
        a.doctorName?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q) ||
        a.status?.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? '';
        let valB = b[sortConfig.key] ?? '';

        if (sortConfig.key === 'appointmentTime') {
          // Compare hour and minute
          const hourA = a.appointmentTime?.hour ?? 0;
          const minA = a.appointmentTime?.minute ?? 0;
          const hourB = b.appointmentTime?.hour ?? 0;
          const minB = b.appointmentTime?.minute ?? 0;
          valA = hourA * 60 + minA;
          valB = hourB * 60 + minB;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [apts, search, sortConfig]);

  // Pagination Calculations
  const paginatedApts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedApts.slice(start, start + pageSize);
  }, [processedApts, currentPage, pageSize]);

  const totalPages = Math.ceil(processedApts.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

  const openAdd  = () => { setErrors({}); setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (a) => {
    setErrors({});
    const timeStr = a.appointmentTime
      ? `${String(a.appointmentTime.hour).padStart(2,'0')}:${String(a.appointmentTime.minute).padStart(2,'0')}`
      : '';
    setForm({
      patientId: a.patientId ?? '',
      doctorId:  a.doctorId  ?? '',
      appointmentDate: a.appointmentDate ?? '',
      appointmentTime: timeStr,
      reason: a.reason ?? '',
      notes: a.notes ?? '',
      status: a.status ?? 'SCHEDULED'
    });
    setModal({ open:true, mode:'edit', data:a });
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(errs => ({ ...errs, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.patientId) newErrors.patientId = 'Patient is required';
    if (!form.doctorId) newErrors.doctorId = 'Doctor is required';
    if (!form.appointmentDate) newErrors.appointmentDate = 'Date is required';
    if (!form.appointmentTime) newErrors.appointmentTime = 'Time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const timeStr = form.appointmentTime ? `${form.appointmentTime}:00` : '09:00:00';
    return {
      patientId: Number(form.patientId),
      doctorId:  Number(form.doctorId),
      appointmentDate: form.appointmentDate,
      appointmentTime: timeStr,
      reason: form.reason,
      notes:  form.notes,
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    try {
      if (modal.mode==='add') await appointmentService.create(buildPayload());
      else await appointmentService.update(modal.data.id, buildPayload());
      toast.success(`Appointment ${modal.mode==='add'?'scheduled':'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await appointmentService.delete(confirm.id); toast.success('Appointment deleted'); setConfirm({open:false,id:null}); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Layout pageTitle="Appointments">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Appointments</h1>
          <p>{processedApts.length} appointment{processedApts.length!==1?'s':''} found</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search by patient or doctor…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button id="add-appointment-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Schedule</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading appointments…</div>
        : processedApts.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No appointments found</h3>
            <p>{search ? 'Try a different search term' : 'Schedule your first appointment to get started'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper"><table>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                  <th onClick={() => requestSort('patientName')}>Patient {getSortIcon('patientName')}</th>
                  <th onClick={() => requestSort('doctorName')}>Doctor {getSortIcon('doctorName')}</th>
                  <th onClick={() => requestSort('appointmentDate')}>Date {getSortIcon('appointmentDate')}</th>
                  <th onClick={() => requestSort('appointmentTime')}>Time {getSortIcon('appointmentTime')}</th>
                  <th onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedApts.map((a,i) => {
                const timeObj = a.appointmentTime;
                const timeStr = timeObj ? `${String(timeObj.hour).padStart(2,'0')}:${String(timeObj.minute).padStart(2,'0')}` : '—';
                return (
                  <tr key={a.id}>
                    <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td><strong>{a.patientName}</strong></td>
                    <td>{a.doctorName ? `Dr. ${a.doctorName}` : '—'}</td>
                    <td className="td-muted">{a.appointmentDate ?? '—'}</td>
                    <td className="td-muted">{timeStr}</td>
                    <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                    <td className="td-muted truncate" style={{maxWidth:140}}>{a.reason||'—'}</td>
                    <td><div style={{display:'flex',gap:6}}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(a)} title="Edit"><Pencil size={14}/></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:a.id})} title="Delete"><Trash2 size={14}/></button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table></div>

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {Math.min(processedApts.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedApts.length, currentPage * pageSize)} of {processedApts.length} appointments
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                {[...Array(totalPages)].map((_, pageIdx) => (
                  <button 
                    key={pageIdx} 
                    className={`pagination-btn ${currentPage === pageIdx + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageIdx + 1)}
                  >
                    {pageIdx + 1}
                  </button>
                ))}
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'📅 Schedule Appointment':'✏️ Edit Appointment'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select className={`form-control ${errors.patientId ? 'is-invalid' : ''}`} name="patientId" value={form.patientId} onChange={handleChange}>
              <option value="">— Select Patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            {errors.patientId && <span className="form-error">{errors.patientId}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Doctor *</label>
            <select className={`form-control ${errors.doctorId ? 'is-invalid' : ''}`} name="doctorId" value={form.doctorId} onChange={handleChange}>
              <option value="">— Select Doctor —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
            {errors.doctorId && <span className="form-error">{errors.doctorId}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className={`form-control ${errors.appointmentDate ? 'is-invalid' : ''}`} type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange}/>
            {errors.appointmentDate && <span className="form-error">{errors.appointmentDate}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Time *</label>
            <input className={`form-control ${errors.appointmentTime ? 'is-invalid' : ''}`} type="time" name="appointmentTime" value={form.appointmentTime} onChange={handleChange}/>
            {errors.appointmentTime && <span className="form-error">{errors.appointmentTime}</span>}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Reason for Visit</label><input className="form-control" name="reason" value={form.reason} onChange={handleChange} placeholder="e.g. Regular checkup"/></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes…" rows={2} style={{resize:'vertical'}}/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Appointment"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Delete this appointment record?</p>
      </Modal>
    </Layout>
  );
}
