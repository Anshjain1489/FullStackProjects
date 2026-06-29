import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { billingService } from '../services/billingService';
import { patientService } from '../services/patientService';
import { Plus, Pencil, Trash2, Search, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentService } from '../services/paymentService';

const PAY_STATUSES = ['PENDING','PAID','PARTIAL','OVERDUE','CANCELLED','REFUNDED'];
const EMPTY = {
  patientId:'', consultationFee:'', roomCharges:'', medicationCharges:'',
  otherCharges:'', paymentStatus:'PENDING', paymentDate:'', paymentMethod:'', notes:''
};

const payBadge = (s) => {
  const map = { PAID:'badge-success', PENDING:'badge-warning', PARTIAL:'badge-info', OVERDUE:'badge-danger', CANCELLED:'badge-danger', REFUNDED:'badge-muted' };
  return map[s] || 'badge-muted';
};

const toNum = (v) => v !== '' && v !== null && v !== undefined ? Number(v) : null;

export default function BillingPage() {
  const [bills, setBills]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [saving, setSaving]     = useState(false);
  const [payingId, setPayingId] = useState(null);
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
      b.patientName?.toLowerCase().includes(q) ||
      b.invoiceNumber?.toLowerCase().includes(q) ||
      b.paymentStatus?.toLowerCase().includes(q)
    ));
  }, [search, bills]);

  const openAdd  = () => { setForm({ ...EMPTY, paymentDate: new Date().toISOString().split('T')[0] }); setModal({ open:true, mode:'add', data:null }); };
  const openEdit = (b) => {
    setForm({
      patientId: b.patientId ?? '',
      consultationFee: b.consultationFee ?? '',
      roomCharges: b.roomCharges ?? '',
      medicationCharges: b.medicationCharges ?? '',
      otherCharges: b.otherCharges ?? '',
      paymentStatus: b.paymentStatus ?? 'PENDING',
      paymentDate: b.paymentDate?.split('T')[0] ?? '',
      paymentMethod: b.paymentMethod ?? '',
      notes: b.notes ?? '',
    });
    setModal({ open:true, mode:'edit', data:b });
  };
  const closeModal = () => setModal({ open:false, mode:'add', data:null });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.patientId) { toast.error('Patient is required'); return; }
    setSaving(true);
    try {
      const payload = {
        patientId: Number(form.patientId),
        consultationFee: toNum(form.consultationFee),
        roomCharges: toNum(form.roomCharges),
        medicationCharges: toNum(form.medicationCharges),
        otherCharges: toNum(form.otherCharges),
        paymentStatus: form.paymentStatus,
        paymentDate: form.paymentDate || null,
        paymentMethod: form.paymentMethod || null,
        notes: form.notes || null,
      };
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

  const handlePayment = async (billId) => {
    setPayingId(billId);
    try {
      await paymentService.checkout(
        billId,
        (verifyData) => {
          toast.success('🎉 Payment successful! Invoice updated.');
          load();
          setPayingId(null);
        },
        (errMsg) => {
          toast.error(errMsg || 'Payment failed.');
          setPayingId(null);
        }
      );
    } catch (err) {
      toast.error('Could not initiate payment.');
      setPayingId(null);
    }
  };

  const totalRevenue = bills.filter(b => b.paymentStatus==='PAID').reduce((s,b) => s+(b.totalAmount||0), 0);
  const pending = bills.filter(b => b.paymentStatus==='PENDING' || b.paymentStatus==='OVERDUE').reduce((s,b) => s+(b.totalAmount||0), 0);

  return (
    <Layout pageTitle="Billing">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Billing & Invoicing</h1>
          <p>💰 Collected: ₹{totalRevenue.toLocaleString('en-IN')} · Pending: ₹{pending.toLocaleString('en-IN')}</p>
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
            <thead><tr><th>#</th><th>Invoice</th><th>Patient</th><th>Total</th><th>Status</th><th>Date</th><th>Method</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((b,i) => (
              <tr key={b.id}>
                <td className="td-muted">{i+1}</td>
                <td className="td-muted">{b.invoiceNumber ?? '—'}</td>
                <td><strong>{b.patientName}</strong></td>
                <td><strong>₹{Number(b.totalAmount||0).toLocaleString('en-IN')}</strong></td>
                <td><span className={`badge ${payBadge(b.paymentStatus)}`}>{b.paymentStatus?.replace('_',' ')}</span></td>
                <td className="td-muted">{b.paymentDate ? new Date(b.paymentDate).toLocaleDateString() : '—'}</td>
                <td className="td-muted">{b.paymentMethod || '—'}</td>
                <td><div style={{display:'flex',gap:6,alignItems:'center'}}>
                  {(b.paymentStatus === 'PENDING' || b.paymentStatus === 'PARTIAL' || b.paymentStatus === 'OVERDUE') && (
                    <button 
                      className="btn btn-primary btn-sm btn-icon" 
                      onClick={() => handlePayment(b.id)} 
                      disabled={payingId === b.id}
                      title="Pay with Razorpay"
                      style={{ background: '#10b981', borderColor: '#10b981' }}
                    >
                      {payingId === b.id ? <div className="spinner" style={{width:14,height:14}}/> : <CreditCard size={14}/>}
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(b)}><Pencil size={14}/></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:b.id})}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'🧾 New Invoice':'✏️ Edit Invoice'} size="modal-lg"
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:'Save Invoice'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Patient *</label>
            <select className="form-control" name="patientId" value={form.patientId} onChange={handleChange}>
              <option value="">— Select Patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Payment Status</label>
            <select className="form-control" name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
              {PAY_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Consultation Fee (₹)</label><input className="form-control" type="number" name="consultationFee" value={form.consultationFee} onChange={handleChange} placeholder="0"/></div>
          <div className="form-group"><label className="form-label">Room Charges (₹)</label><input className="form-control" type="number" name="roomCharges" value={form.roomCharges} onChange={handleChange} placeholder="0"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Medication Charges (₹)</label><input className="form-control" type="number" name="medicationCharges" value={form.medicationCharges} onChange={handleChange} placeholder="0"/></div>
          <div className="form-group"><label className="form-label">Other Charges (₹)</label><input className="form-control" type="number" name="otherCharges" value={form.otherCharges} onChange={handleChange} placeholder="0"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Payment Date</label><input className="form-control" type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange}/></div>
          <div className="form-group"><label className="form-label">Payment Method</label><input className="form-control" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} placeholder="Cash / Card / UPI"/></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes…" rows={2} style={{resize:'vertical'}}/></div>
      </Modal>

      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Invoice"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Permanently delete this invoice?</p>
      </Modal>
    </Layout>
  );
}
