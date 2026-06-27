import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { doctorService }     from '../services/doctorService';
import { departmentService } from '../services/departmentService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', specialization:'', qualification:'', departmentId:'' };

export default function DoctorsPage() {
  const [doctors, setDoctors]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]       = useState({ open:false, id:null });
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, dep] = await Promise.all([doctorService.getAll(), departmentService.getAll()]);
      const data = dr.data?.data ?? [];
      setDoctors(data); setFiltered(data);
      setDepartments(dep.data?.data ?? []);
    } catch { toast.error('Failed to load doctors'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(doctors.filter(d =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q)
    ));
  }, [search, doctors]);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (d) => { setForm({ ...d, departmentId: d.department?.id ?? '' }); setModal({ open:true, mode:'edit', data:d }); };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, departmentId: form.departmentId ? Number(form.departmentId) : null };
      if (modal.mode === 'add') await doctorService.create(payload);
      else await doctorService.update(modal.data.id, payload);
      toast.success(`Doctor ${modal.mode === 'add' ? 'added' : 'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await doctorService.delete(confirm.id); toast.success('Doctor removed'); setConfirm({ open:false, id:null }); load(); }
    catch { toast.error('Failed to delete doctor'); }
  };

  return (
    <Layout pageTitle="Doctors">
      <div className="page-header">
        <div className="page-header-left"><h1>Doctors</h1><p>{filtered.length} doctor{filtered.length!==1?'s':''}</p></div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box"><span className="search-icon"><Search size={15}/></span><input placeholder="Search doctors…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button id="add-doctor-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Doctor</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading…</div>
        : filtered.length===0 ? <div className="empty-state"><div className="empty-state-icon">👨‍⚕️</div><h3>No doctors found</h3><p>Add your first doctor</p></div>
        : (
          <div className="table-wrapper"><table>
            <thead><tr><th>#</th><th>Name</th><th>Specialization</th><th>Department</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((d,i) => (
              <tr key={d.id}>
                <td className="td-muted">{i+1}</td>
                <td><strong>Dr. {d.firstName} {d.lastName}</strong></td>
                <td>{d.specialization||'—'}</td>
                <td>{d.department?.name ? <span className="badge badge-info">{d.department.name}</span> : '—'}</td>
                <td className="td-muted">{d.email}</td>
                <td>{d.phone||'—'}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(d)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:d.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'➕ Add Doctor':'✏️ Edit Doctor'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save Doctor'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">First Name *</label><input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John"/></div>
          <div className="form-group"><label className="form-label">Last Name *</label><input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Smith"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="dr.smith@hospital.com"/></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Specialization</label><input className="form-control" name="specialization" value={form.specialization} onChange={handleChange} placeholder="Cardiology"/></div>
          <div className="form-group"><label className="form-label">Qualification</label><input className="form-control" name="qualification" value={form.qualification} onChange={handleChange} placeholder="MBBS, MD"/></div>
        </div>
        <div className="form-group"><label className="form-label">Department</label>
          <select className="form-control" name="departmentId" value={form.departmentId} onChange={handleChange}>
            <option value="">— No Department —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Remove Doctor"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Remove</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Remove this doctor? This cannot be undone.</p>
      </Modal>
    </Layout>
  );
}
