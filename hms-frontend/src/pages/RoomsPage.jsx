import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { roomService } from '../services/roomService';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const ROOM_TYPES   = ['GENERAL','PRIVATE','SEMI_PRIVATE','ICU','EMERGENCY','OPERATION_THEATRE','LABOR','PEDIATRIC'];
const ROOM_STATUSES= ['AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED'];
const EMPTY = { roomNumber:'', roomType:'GENERAL', status:'AVAILABLE', floor:'', pricePerDay:'' };

const statusBadge = (s) => {
  const map = { AVAILABLE:'badge-success', OCCUPIED:'badge-danger', MAINTENANCE:'badge-warning', RESERVED:'badge-info' };
  return map[s] || 'badge-muted';
};

export default function RoomsPage() {
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);
  
  // Validation State
  const [errors, setErrors]     = useState({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'roomNumber', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const r = await roomService.getAll(); 
      const d = r.data?.data??[]; 
      setRooms(d); 
    } catch { toast.error('Failed to load rooms'); }
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

  // Filter & Sort Rooms
  const processedRooms = useMemo(() => {
    let result = [...rooms];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.roomNumber?.toLowerCase().includes(q) ||
        r.roomType?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
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
  }, [rooms, search, sortConfig]);

  // Pagination Calculations
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRooms.slice(start, start + pageSize);
  }, [processedRooms, currentPage, pageSize]);

  const totalPages = Math.ceil(processedRooms.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

  const openAdd  = () => { setErrors({}); setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (r) => { 
    setErrors({});
    setForm({ 
      roomNumber:r.roomNumber, 
      roomType:r.roomType, 
      status:r.status, 
      floor:r.floor??'', 
      pricePerDay:r.pricePerDay??'' 
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
    if (!form.roomNumber.trim()) newErrors.roomNumber = 'Room number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    try {
      const payload = { roomNumber: form.roomNumber, roomType: form.roomType, status: form.status, floor: form.floor ? Number(form.floor) : null, pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : null };
      if (modal.mode==='add') await roomService.create(payload);
      else await roomService.update(modal.data.id, payload);
      toast.success(`Room ${modal.mode==='add'?'added':'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await roomService.delete(confirm.id); toast.success('Room deleted'); setConfirm({open:false,id:null}); load(); }
    catch { toast.error('Failed to delete room'); }
  };

  const available = rooms.filter(r => r.status === 'AVAILABLE').length;

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Layout pageTitle="Rooms">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Rooms</h1>
          <p>{available} available / {rooms.length} total rooms</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search rooms…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button id="add-room-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Room</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading rooms…</div>
        : processedRooms.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛏️</div>
            <h3>No rooms found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first hospital room to get started'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper"><table>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                  <th onClick={() => requestSort('roomNumber')}>Room No. {getSortIcon('roomNumber')}</th>
                  <th onClick={() => requestSort('roomType')}>Type {getSortIcon('roomType')}</th>
                  <th onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                  <th onClick={() => requestSort('floor')}>Floor {getSortIcon('floor')}</th>
                  <th onClick={() => requestSort('pricePerDay')}>Price/Day {getSortIcon('pricePerDay')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedRooms.map((r,i) => (
                <tr key={r.id}>
                  <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td><strong>{r.roomNumber}</strong></td>
                  <td>{r.roomType?.replace('_',' ')}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status?.replace('_',' ')}</span></td>
                  <td>{r.floor ?? '—'}</td>
                  <td>{r.pricePerDay ? `₹${Number(r.pricePerDay).toLocaleString('en-IN')}` : '—'}</td>
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
                Showing {Math.min(processedRooms.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedRooms.length, currentPage * pageSize)} of {processedRooms.length} rooms
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

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'🛏️ Add Room':'✏️ Edit Room'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Room Number *</label>
            <input className={`form-control ${errors.roomNumber ? 'is-invalid' : ''}`} name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="e.g. A-101" autoFocus/>
            {errors.roomNumber && <span className="form-error">{errors.roomNumber}</span>}
          </div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-control" name="roomType" value={form.roomType} onChange={handleChange}>{ROOM_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}>{ROOM_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Floor</label><input className="form-control" type="number" name="floor" value={form.floor} onChange={handleChange} min={0} placeholder="e.g. 2"/></div>
        </div>
        <div className="form-group"><label className="form-label">Price Per Day (₹)</label><input className="form-control" type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange} placeholder="e.g. 2500"/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Room"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Delete this room record?</p>
      </Modal>
    </Layout>
  );
}
