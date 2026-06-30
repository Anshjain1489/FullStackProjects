import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { patientService } from '../services/patientService';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', dateOfBirth:'', gender:'MALE', bloodGroup:'O_POSITIVE', address:'', emergencyContact:'', emergencyContactName:'' };
const GENDERS = ['MALE','FEMALE','OTHER'];
const BLOOD_GROUPS = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','O_POSITIVE','O_NEGATIVE','AB_POSITIVE','AB_NEGATIVE'];
const fmt = s => s?.replace('_',' ') ?? '—';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open: false, mode: 'add', data: null });
  const [confirm, setConfirm]   = useState({ open: false, id: null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);
  
  // Validation State
  const [errors, setErrors]     = useState({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientService.getAll();
      const data = res.data?.data ?? [];
      setPatients(data);
    } catch { toast.error('Failed to load patients'); }
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

  // Filter & Sort Patients
  const processedPatients = useMemo(() => {
    let result = [...patients];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.bloodGroup?.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? '';
        let valB = b[sortConfig.key] ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [patients, search, sortConfig]);

  // Pagination Calculations
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedPatients.slice(start, start + pageSize);
  }, [processedPatients, currentPage, pageSize]);

  const totalPages = Math.ceil(processedPatients.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

  const openAdd  = () => { setErrors({}); setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (p) => { 
    setErrors({});
    setForm({ ...p, dateOfBirth: p.dateOfBirth?.split('T')[0] ?? '' }); 
    setModal({ open:true, mode:'edit', data:p }); 
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(errs => ({ ...errs, [name]: '' })); // Clear error
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const FormFields = (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" />
          {errors.firstName && <span className="form-error">{errors.firstName}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Last Name *</label>
          <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" />
          {errors.lastName && <span className="form-error">{errors.lastName}</span>}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input className={`form-control ${errors.phone ? 'is-invalid' : ''}`} name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="patient@email.com" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date of Birth *</label>
          <input className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
          {errors.dateOfBirth && <span className="form-error">{errors.dateOfBirth}</span>}
        </div>
        <div className="form-group"><label className="form-label">Gender *</label><select className="form-control" name="gender" value={form.gender} onChange={handleChange}>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Blood Group</label><select className="form-control" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>{BLOOD_GROUPS.map(b => <option key={b} value={b}>{fmt(b)}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Address</label><input className="form-control" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Emergency Contact</label><input className="form-control" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Jane Doe" /></div>
        <div className="form-group"><label className="form-label">Emergency Phone</label><input className="form-control" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="+91 9876543210" /></div>
      </div>
    </>
  );

  return (
    <Layout pageTitle="Patients">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patients</h1>
          <p>{processedPatients.length} patient{processedPatients.length !== 1 ? 's' : ''} found</p>
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
        ) : processedPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>No patients found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first patient to get started'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                    <th onClick={() => requestSort('firstName')}>Name {getSortIcon('firstName')}</th>
                    <th onClick={() => requestSort('email')}>Email {getSortIcon('email')}</th>
                    <th onClick={() => requestSort('phone')}>Phone {getSortIcon('phone')}</th>
                    <th onClick={() => requestSort('gender')}>Gender {getSortIcon('gender')}</th>
                    <th onClick={() => requestSort('bloodGroup')}>Blood Group {getSortIcon('bloodGroup')}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((p, i) => (
                    <tr key={p.id}>
                      <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
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

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {Math.min(processedPatients.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedPatients.length, currentPage * pageSize)} of {processedPatients.length} patients
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
