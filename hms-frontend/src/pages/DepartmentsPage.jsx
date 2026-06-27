import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { departmentService } from '../services/departmentService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', description:'' };

export default function DepartmentsPage() {
  const [depts, setDepts]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm] = useState({ open:false, id:null });
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await departmentService.getAll(); const d = r.data?.data??[]; setDepts(d); setFiltered(d); }
    catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(depts.filter(d => d.name?.toLowerCase().includes(q)));
  }, [search, depts]);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (d) => { setForm({ name:d.name, description:d.description||'' }); setModal({ open:true, mode:'edit', data:d }); };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Department name is required'); return; }
    setSaving(true);
    try {
      if (modal.mode==='add') await departmentService.create(form);
      else await departmentService.update(modal.data.id, form);
      toast.success(`Department ${modal.mode==='add'?'created':'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await departmentService.delete(confirm.id); toast.success('Department deleted'); setConfirm({open:false,id:null}); load(); }
    catch { toast.error('Failed to delete department'); }
  };

  return (
    <Layout pageTitle="Departments">
      <div className="page-header">
        <div className="page-header-left"><h1>Departments</h1><p>{filtered.length} department{filtered.length!==1?'s':''}</p></div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box"><span className="search-icon"><Search size={15}/></span><input placeholder="Search departments…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button id="add-department-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Department</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading…</div>
        : filtered.length===0 ? <div className="empty-state"><div className="empty-state-icon">🏢</div><h3>No departments found</h3><p>Create your first department</p></div>
        : (
          <div className="table-wrapper"><table>
            <thead><tr><th>#</th><th>Department Name</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((d,i) => (
              <tr key={d.id}>
                <td className="td-muted">{i+1}</td>
                <td><strong>{d.name}</strong></td>
                <td className="td-muted">{d.description||'No description'}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(d)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:d.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'➕ Add Department':'✏️ Edit Department'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save'}</button></>}>
        <div className="form-group"><label className="form-label">Department Name *</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Cardiology" autoFocus/></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Brief description…" rows={3} style={{resize:'vertical'}}/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Department"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Delete this department? Doctors assigned here may be affected.</p>
      </Modal>
    </Layout>
  );
}
