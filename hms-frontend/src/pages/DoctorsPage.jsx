import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { doctorService }     from '../services/doctorService';
import { departmentService } from '../services/departmentService';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', specialization:'', qualification:'', departmentId:'' };

export default function DoctorsPage() {
  const [doctors, setDoctors]         = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]         = useState({ open:false, id:null });
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState(EMPTY);
  
  // Validation State
  const [errors, setErrors]           = useState({});

  // Sorting State
  const [sortConfig, setSortConfig]   = useState({ key: 'firstName', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, dep] = await Promise.all([doctorService.getAll(), departmentService.getAll()]);
      const data = dr.data?.data ?? [];
      setDoctors(data);
      setDepartments(dep.data?.data ?? []);
    } catch { toast.error('Failed to load doctors'); }
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

  // Filter & Sort Doctors
  const processedDoctors = useMemo(() => {
    let result = [...doctors];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.department?.name?.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? '';
        let valB = b[sortConfig.key] ?? '';

        if (sortConfig.key === 'department') {
          valA = a.department?.name ?? '';
          valB = b.department?.name ?? '';
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [doctors, search, sortConfig]);

  // Pagination Calculations
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedDoctors.slice(start, start + pageSize);
  }, [processedDoctors, currentPage, pageSize]);

  const totalPages = Math.ceil(processedDoctors.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

  const openAdd  = () => { setErrors({}); setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (d) => { 
    setErrors({});
    setForm({ ...d, departmentId: d.department?.id ?? '' }); 
    setModal({ open:true, mode:'edit', data:d }); 
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(errs => ({ ...errs, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Layout pageTitle="Doctors">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Doctors</h1>
          <p>{processedDoctors.length} doctor{processedDoctors.length!==1?'s':''} found</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search doctors…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button id="add-doctor-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Doctor</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading doctors…</div>
        : processedDoctors.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👨‍⚕️</div>
            <h3>No doctors found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first doctor to get started'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper"><table>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                  <th onClick={() => requestSort('firstName')}>Name {getSortIcon('firstName')}</th>
                  <th onClick={() => requestSort('specialization')}>Specialization {getSortIcon('specialization')}</th>
                  <th onClick={() => requestSort('department')}>Department {getSortIcon('department')}</th>
                  <th onClick={() => requestSort('email')}>Email {getSortIcon('email')}</th>
                  <th onClick={() => requestSort('phone')}>Phone {getSortIcon('phone')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedDoctors.map((d,i) => (
                <tr key={d.id}>
                  <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td><strong>Dr. {d.firstName} {d.lastName}</strong></td>
                  <td>{d.specialization||'—'}</td>
                  <td>{d.department?.name ? <span className="badge badge-info">{d.department.name}</span> : '—'}</td>
                  <td className="td-muted">{d.email}</td>
                  <td>{d.phone||'—'}</td>
                  <td><div style={{display:'flex',gap:6}}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(d)} title="Edit"><Pencil size={14}/></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:d.id})} title="Delete"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table></div>

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {Math.min(processedDoctors.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedDoctors.length, currentPage * pageSize)} of {processedDoctors.length} doctors
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

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'➕ Add Doctor':'✏️ Edit Doctor'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save Doctor'}</button></>}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} name="firstName" value={form.firstName} onChange={handleChange} placeholder="John"/>
            {errors.firstName && <span className="form-error">{errors.firstName}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Smith"/>
            {errors.lastName && <span className="form-error">{errors.lastName}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="dr.smith@hospital.com"/>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
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
