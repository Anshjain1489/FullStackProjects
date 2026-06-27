import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { medicalRecordService } from '../services/medicalRecordService';
import { patientService }       from '../services/patientService';
import { doctorService }        from '../services/doctorService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { patientId:'', doctorId:'', diagnosis:'', prescription:'', notes:'', recordDate:'' };

export default function MedicalRecordsPage() {
  const [records, setRecords]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rr, pr, dr] = await Promise.all([medicalRecordService.getAll(), patientService.getAll(), doctorService.getAll()]);
      const data = rr.data?.data ?? [];
      setRecords(data); setFiltered(data);
      setPatients(pr.data?.data ?? []);
      setDoctors(dr.data?.data ?? []);
    } catch { toast.error('Failed to load medical records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r =>
      `${r.patient?.firstName} ${r.patient?.lastName}`.toLowerCase().includes(q) ||
      r.diagnosis?.toLowerCase().includes(q)
    ));
  }, [search, records]);

  const openAdd  = () => { setForm({ ...EMPTY, recordDate: new Date().toISOString().split('T')[0] }); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (r) => {
    setForm({ patientId: r.patient?.id??'', doctorId: r.doctor?.id??'', diagnosis: r.diagnosis??'', prescription: r.prescription??'', notes: r.notes??'', recordDate: r.recordDate?.split('T')[0]??'' });
    setModal({ open:true, mode:'edit', data:r });
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.patientId || !form.diagnosis) { toast.error('Patient and diagnosis are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, patientId: Number(form.patientId), doctorId: form.doctorId ? Number(form.doctorId) : null };
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

  return (
    <Layout pageTitle="Medical Records">
      <div className="page-header">
        <div className="page-header-left"><h1>Medical Records</h1><p>{filtered.length} record{filtered.length!==1?'s':''}</p></div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box"><span className="search-icon"><Search size={15}/></span><input placeholder="Search by patient or diagnosis…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button id="add-record-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Record</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading…</div>
        : filtered.length===0 ? <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No records found</h3><p>Add the first medical record</p></div>
        : (
          <div className="table-wrapper"><table>
            <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((r,i) => (
              <tr key={r.id}>
                <td className="td-muted">{i+1}</td>
                <td><strong>{r.patient?.firstName} {r.patient?.lastName}</strong></td>
                <td>{r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '—'}</td>
                <td>{r.diagnosis}</td>
                <td className="td-muted">{r.recordDate ? new Date(r.recordDate).toLocaleDateString() : '—'}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(r)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:r.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'📋 Add Medical Record':'✏️ Edit Record'} size="modal-lg"
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save Record'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Patient *</label>
            <select className="form-control" name="patientId" value={form.patientId} onChange={handleChange}>
              <option value="">— Select Patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Doctor</label>
            <select className="form-control" name="doctorId" value={form.doctorId} onChange={handleChange}>
              <option value="">— Select Doctor —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Diagnosis *</label><input className="form-control" name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="Primary diagnosis"/></div>
          <div className="form-group"><label className="form-label">Record Date</label><input className="form-control" type="date" name="recordDate" value={form.recordDate} onChange={handleChange}/></div>
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
