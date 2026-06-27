import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { billingService } from '../services/billingService';
import { patientService } from '../services/patientService';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const PAY_STATUSES = ['PENDING','PAID','PARTIALLY_PAID','CANCELLED'];
const EMPTY = { patientId:'', totalAmount:'', description:'', paymentStatus:'PENDING', invoiceDate:'' };

const payBadge = (s) => {
  const map = { PAID:'badge-success', PENDING:'badge-warning', PARTIALLY_PAID:'badge-info', CANCELLED:'badge-danger' };
  return map[s] || 'badge-muted';
};

export default function BillingPage() {
  const [bills, setBills]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [br, pr] = await Promise.all([billingService.getAll(), patientService.getAll()]);
      const data = br.data?.data ?? [];
      setBills(data); setFiltered(data);
      setPatients(pr.data?.data ?? []);
    } catch { toast.error('Failed to load billing records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(bills.filter(b =>
      `${b.patient?.firstName} ${b.patient?.lastName}`.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.paymentStatus?.toLowerCase().includes(q)
    ));
  }, [search, bills]);

  const openAdd  = () => { setForm({ ...EMPTY, invoiceDate: new Date().toISOString().split('T')[0] }); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (b) => {
    setForm({ patientId: b.patient?.id??'', totalAmount: b.totalAmount??'', description: b.description??'', paymentStatus: b.paymentStatus??'PENDING', invoiceDate: b.invoiceDate?.split('T')[0]??'' });
    setModal({ open:true, mode:'edit', data:b });
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.patientId || !form.totalAmount) { toast.error('Patient and amount are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, patientId: Number(form.patientId), totalAmount: Number(form.totalAmount) };
      if (modal.mode==='add') await billingService.create(payload);
      else await billingService.update(modal.data.id, payload);
      toast.success(`Invoice ${modal.mode==='add'?'created':'updated'}!`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save invoice'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await billingService.delete(confirm.id); toast.success('Invoice deleted'); setConfirm({open:false,id:null}); load(); }
    catch { toast.error('Failed to delete invoice'); }
  };

  const totalRevenue = bills.filter(b => b.paymentStatus==='PAID').reduce((s,b) => s+(b.totalAmount||0), 0);
  const pending = bills.filter(b => b.paymentStatus==='PENDING').reduce((s,b) => s+(b.totalAmount||0), 0);

  return (
    <Layout pageTitle="Billing">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Billing & Invoicing</h1>
          <p>💰 Revenue: ₹{totalRevenue.toLocaleString('en-IN')} collected · ₹{pending.toLocaleString('en-IN')} pending</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box"><span className="search-icon"><Search size={15}/></span><input placeholder="Search invoices…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button id="add-invoice-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>New Invoice</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading…</div>
        : filtered.length===0 ? <div className="empty-state"><div className="empty-state-icon">🧾</div><h3>No invoices found</h3><p>Create the first billing invoice</p></div>
        : (
          <div className="table-wrapper"><table>
            <thead><tr><th>#</th><th>Patient</th><th>Amount</th><th>Status</th><th>Invoice Date</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((b,i) => (
              <tr key={b.id}>
                <td className="td-muted">{i+1}</td>
                <td><strong>{b.patient?.firstName} {b.patient?.lastName}</strong></td>
                <td><strong>₹{Number(b.totalAmount||0).toLocaleString('en-IN')}</strong></td>
                <td><span className={`badge ${payBadge(b.paymentStatus)}`}>{b.paymentStatus?.replace('_',' ')}</span></td>
                <td className="td-muted">{b.invoiceDate ? new Date(b.invoiceDate).toLocaleDateString() : '—'}</td>
                <td className="td-muted truncate" style={{maxWidth:180}}>{b.description||'—'}</td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(b)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:b.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'🧾 New Invoice':'✏️ Edit Invoice'}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save Invoice'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Patient *</label>
            <select className="form-control" name="patientId" value={form.patientId} onChange={handleChange}>
              <option value="">— Select Patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Total Amount (₹) *</label><input className="form-control" type="number" name="totalAmount" value={form.totalAmount} onChange={handleChange} placeholder="e.g. 5000"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Payment Status</label><select className="form-control" name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>{PAY_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Invoice Date</label><input className="form-control" type="date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange}/></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Services rendered, treatments, etc." rows={3} style={{resize:'vertical'}}/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Invoice"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Permanently delete this invoice?</p>
      </Modal>
    </Layout>
  );
}
