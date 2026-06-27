import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { patientService } from '../services/patientService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', dateOfBirth:'', gender:'MALE', bloodGroup:'O_POSITIVE', address:'' };
const GENDERS = ['MALE','FEMALE','OTHER'];
const BLOOD_GROUPS = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','O_POSITIVE','O_NEGATIVE','AB_POSITIVE','AB_NEGATIVE'];
const fmt = s => s?.replace('_',' ') ?? '—';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open: false, mode: 'add', data: null });
  const [confirm, setConfirm]   = useState({ open: false, id: null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientService.getAll();
      const data = res.data?.data ?? [];
      setPatients(data); setFiltered(data);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    ));
  }, [search, patients]);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (p) => { setForm({ ...p, dateOfBirth: p.dateOfBirth?.split('T')[0] ?? '' }); setModal({ open:true, mode:'edit', data:p }); };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) { toast.error('First name, last name and email are required'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') await patientService.create(form);
      else await patientService.update(modal.data.id, form);
      toast.success(`Patient ${modal.mode === 'add' ? 'added' : 'updated'}!`);
      closeModal(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save patient');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await patientService.delete(confirm.id);
      toast.success('Patient deleted');
      setConfirm({ open:false, id:null }); load();
    } catch { toast.error('Failed to delete patient'); }
  };

  const FormFields = (
    <>
      <div className="form-row">
        <div className="form-group"><label className="form-label">First Name *</label><input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" /></div>
        <div className="form-group"><label className="form-label">Last Name *</label><input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="patient@email.com" /></div>
        <div className="form-group"><label className="form-label">Phone</label><input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} /></div>
        <div className="form-group"><label className="form-label">Gender</label><select className="form-control" name="gender" value={form.gender} onChange={handleChange}>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Blood Group</label><select className="form-control" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>{BLOOD_GROUPS.map(b => <option key={b} value={b}>{fmt(b)}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Address</label><input className="form-control" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" /></div>
      </div>
    </>
  );

  return (
    <Layout pageTitle="Patients">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patients</h1>
          <p>{filtered.length} patient{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button id="add-patient-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Patient</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner-page"><div className="spinner"/>Loading patients…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👤</div><h3>No patients found</h3><p>{search ? 'Try a different search term' : 'Add your first patient to get started'}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th><th>Blood Group</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td className="td-muted">{i+1}</td>
                    <td><strong>{p.firstName} {p.lastName}</strong></td>
                    <td className="td-muted">{p.email}</td>
                    <td>{p.phone || '—'}</td>
                    <td><span className="badge badge-primary">{p.gender}</span></td>
                    <td>{fmt(p.bloodGroup)}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit"><Pencil size={14}/></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm({ open:true, id:p.id })} title="Delete"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode === 'add' ? '➕ Add Patient' : '✏️ Edit Patient'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? <><span className="spinner"/>Saving…</> : 'Save Patient'}</button></>}>
        {FormFields}
      </Modal>

      <Modal isOpen={confirm.open} onClose={() => setConfirm({ open:false, id:null })} title="Delete Patient"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirm({ open:false, id:null })}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Are you sure you want to delete this patient? This action cannot be undone.</p>
      </Modal>
    </Layout>
  );
}
