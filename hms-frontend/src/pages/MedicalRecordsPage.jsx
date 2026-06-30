import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { medicalRecordService } from '../services/medicalRecordService';
import { patientService }       from '../services/patientService';
import { doctorService }        from '../services/doctorService';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { patientId:'', doctorId:'', diagnosis:'', prescription:'', notes:'', visitDate:'' };

export default function MedicalRecordsPage() {
  const [records, setRecords]   = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);
  
  // Validation State
  const [errors, setErrors]     = useState({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'visitDate', direction: 'desc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rr, pr, dr] = await Promise.all([
        medicalRecordService.getAll(), patientService.getAll(), doctorService.getAll()
      ]);
      const data = rr.data?.data ?? [];
      setRecords(data);
      setPatients(pr.data?.data ?? []);
      setDoctors(dr.data?.data ?? []);
    } catch { toast.error('Failed to load medical records'); }
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

  // Filter & Sort Medical Records
  const processedRecords = useMemo(() => {
    let result = [...records];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        `${r.patient?.firstName} ${r.patient?.lastName}`.toLowerCase().includes(q) ||
        `${r.doctor?.firstName} ${r.doctor?.lastName}`.toLowerCase().includes(q) ||
        r.diagnosis?.toLowerCase().includes(q) ||
        r.prescription?.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? '';
        let valB = b[sortConfig.key] ?? '';

        if (sortConfig.key === 'patient') {
          valA = `${a.patient?.firstName} ${a.patient?.lastName}`.trim();
          valB = `${b.patient?.firstName} ${b.patient?.lastName}`.trim();
        } else if (sortConfig.key === 'doctor') {
          valA = `${a.doctor?.firstName} ${a.doctor?.lastName}`.trim();
          valB = `${b.doctor?.firstName} ${b.doctor?.lastName}`.trim();
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [records, search, sortConfig]);

  // Pagination Calculations
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRecords.slice(start, start + pageSize);
  }, [processedRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

  const openAdd  = () => { 
    setErrors({});
    setForm({ ...EMPTY, visitDate: new Date().toISOString().split('T')[0] }); 
    setModal({ open:true, mode:'add', data:null }); 
  };
  const openEdit = (r) => {
    setErrors({});
    setForm({ 
      patientId: r.patient?.id??r.patientId??'', 
      doctorId: r.doctor?.id??r.doctorId??'', 
      diagnosis: r.diagnosis??'', 
      prescription: r.prescription??'', 
      notes: r.notes??'', 
      visitDate: r.visitDate?.split('T')[0]??'' 
    });
    setModal({ open:true, mode:'edit', data:r });
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
    if (!form.diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
    if (!form.visitDate) newErrors.visitDate = 'Visit date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    try {
      const payload = { 
        patientId: Number(form.patientId), 
        doctorId: Number(form.doctorId), 
        visitDate: form.visitDate, 
        diagnosis: form.diagnosis, 
        prescription: form.prescription, 
        notes: form.notes 
      };
      if (modal.mode==='add') await medicalRecordService.create(payload);
      else await medicalRecordService.update(modal.data.id, payload);
      toast.success(`Record ${modal.mode==='add'?'created':'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await medicalRecordService.delete(confirm.id); toast.success('Record deleted'); setConfirm({open:false,id:null}); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Layout pageTitle="Medical Records">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Medical Records</h1>
          <p>{processedRecords.length} record{processedRecords.length!==1?'s':''} found</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search by patient or diagnosis…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button id="add-record-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Record</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading records…</div>
        : processedRecords.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No records found</h3>
            <p>{search ? 'Try a different search term' : 'Add the first medical record to get started'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper"><table>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                  <th onClick={() => requestSort('patient')}>Patient {getSortIcon('patient')}</th>
                  <th onClick={() => requestSort('doctor')}>Doctor {getSortIcon('doctor')}</th>
                  <th onClick={() => requestSort('diagnosis')}>Diagnosis {getSortIcon('diagnosis')}</th>
                  <th onClick={() => requestSort('visitDate')}>Date {getSortIcon('visitDate')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedRecords.map((r,i) => (
                <tr key={r.id}>
                  <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td><strong>{r.patient?.firstName} {r.patient?.lastName}</strong></td>
                  <td>{r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '—'}</td>
                  <td>{r.diagnosis}</td>
                  <td>{r.visitDate ? new Date(r.visitDate).toLocaleDateString() : '—'}</td>
                  <td><div style={{display:'flex',gap:6}}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(r)} title="Edit"><Pencil size={14}/></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:r.id})} title="Delete"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table></div>

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {Math.min(processedRecords.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedRecords.length, currentPage * pageSize)} of {processedRecords.length} records
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

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'📋 Add Medical Record':'✏️ Edit Record'} size="modal-lg"
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save Record'}</button></>}>
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
            <label className="form-label">Diagnosis *</label>
            <input className={`form-control ${errors.diagnosis ? 'is-invalid' : ''}`} name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="Primary diagnosis"/>
            {errors.diagnosis && <span className="form-error">{errors.diagnosis}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Visit Date *</label>
            <input className={`form-control ${errors.visitDate ? 'is-invalid' : ''}`} type="date" name="visitDate" value={form.visitDate} onChange={handleChange}/>
            {errors.visitDate && <span className="form-error">{errors.visitDate}</span>}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Prescription</label><textarea className="form-control" name="prescription" value={form.prescription} onChange={handleChange} placeholder="Medications prescribed…" rows={3} style={{resize:'vertical'}}/></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional clinical notes…" rows={3} style={{resize:'vertical'}}/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Record"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Permanently delete this medical record?</p>
      </Modal>
    </Layout>
  );
}
