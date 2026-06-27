import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { roomService } from '../services/roomService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ROOM_TYPES   = ['GENERAL','PRIVATE','ICU','EMERGENCY','OPERATION_THEATER','CONSULTATION'];
const ROOM_STATUSES= ['AVAILABLE','OCCUPIED','UNDER_MAINTENANCE','RESERVED'];
const EMPTY = { roomNumber:'', type:'GENERAL', status:'AVAILABLE', capacity:1, pricePerDay:'' };

const statusBadge = (s) => {
  const map = { AVAILABLE:'badge-success', OCCUPIED:'badge-danger', UNDER_MAINTENANCE:'badge-warning', RESERVED:'badge-info' };
  return map[s] || 'badge-muted';
};

export default function RoomsPage() {
  const [rooms, setRooms]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await roomService.getAll(); const d = r.data?.data??[]; setRooms(d); setFiltered(d); }
    catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(rooms.filter(r =>
      r.roomNumber?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    ));
  }, [search, rooms]);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (r) => { setForm({ roomNumber:r.roomNumber, type:r.type, status:r.status, capacity:r.capacity??1, pricePerDay:r.pricePerDay??'' }); setModal({ open:true, mode:'edit', data:r }); };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.roomNumber.trim()) { toast.error('Room number is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity), pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : null };
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

  return (
    <Layout pageTitle="Rooms">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Rooms</h1>
          <p>{available} available / {rooms.length} total rooms</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box"><span className="search-icon"><Search size={15}/></span><input placeholder="Search rooms…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button id="add-room-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Room</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading…</div>
        : filtered.length===0 ? <div className="empty-state"><div className="empty-state-icon">🛏️</div><h3>No rooms found</h3><p>Add hospital rooms</p></div>
        : (
          <div className="table-wrapper"><table>
            <thead><tr><th>#</th><th>Room No.</th><th>Type</th><th>Status</th><th>Capacity</th><th>Price/Day</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((r,i) => (
              <tr key={r.id}>
                <td className="td-muted">{i+1}</td>
                <td><strong>{r.roomNumber}</strong></td>
                <td>{r.type?.replace('_',' ')}</td>
                <td><span className={`badge ${statusBadge(r.status)}`}>{r.status?.replace('_',' ')}</span></td>
                <td>{r.capacity ?? 1}</td>
                <td>{r.pricePerDay ? `₹${Number(r.pricePerDay).toLocaleString('en-IN')}` : '—'}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(r)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:r.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'🛏️ Add Room':'✏️ Edit Room'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Room Number *</label><input className="form-control" name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="e.g. A-101" autoFocus/></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-control" name="type" value={form.type} onChange={handleChange}>{ROOM_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}>{ROOM_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Capacity</label><input className="form-control" type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1}/></div>
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
