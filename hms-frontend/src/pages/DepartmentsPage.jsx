import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { departmentService } from '../services/departmentService';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', description:'' };

export default function DepartmentsPage() {
  const [depts, setDepts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);
  
  // Validation State
  const [errors, setErrors]     = useState({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const r = await departmentService.getAll(); 
      const d = r.data?.data??[]; 
      setDepts(d); 
    } catch { toast.error('Failed to load departments'); }
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

  // Filter & Sort Departments
  const processedDepts = useMemo(() => {
    let result = [...depts];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => 
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
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
  }, [depts, search, sortConfig]);

  // Pagination Calculations
  const paginatedDepts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedDepts.slice(start, start + pageSize);
  }, [processedDepts, currentPage, pageSize]);

  const totalPages = Math.ceil(processedDepts.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

  const openAdd  = () => { setErrors({}); setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (d) => { 
    setErrors({});
    setForm({ name:d.name, description:d.description||'' }); 
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
    if (!form.name.trim()) newErrors.name = 'Department name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Layout pageTitle="Departments">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Departments</h1>
          <p>{processedDepts.length} department{processedDepts.length!==1?'s':''} found</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search departments…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button id="add-department-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Department</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading departments…</div>
        : processedDepts.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3>No departments found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first department to get started'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper"><table>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                  <th onClick={() => requestSort('name')}>Department Name {getSortIcon('name')}</th>
                  <th onClick={() => requestSort('description')}>Description {getSortIcon('description')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedDepts.map((d,i) => (
                <tr key={d.id}>
                  <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td><strong>{d.name}</strong></td>
                  <td className="td-muted">{d.description||'No description'}</td>
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
                Showing {Math.min(processedDepts.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedDepts.length, currentPage * pageSize)} of {processedDepts.length} departments
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

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'➕ Add Department':'✏️ Edit Department'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save'}</button></>}>
        <div className="form-group">
          <label className="form-label">Department Name *</label>
          <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Cardiology" autoFocus/>
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
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
