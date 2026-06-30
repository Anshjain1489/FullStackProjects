import { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal  from '../components/Modal';
import { billingService } from '../services/billingService';
import { patientService } from '../services/patientService';
import { 
  Plus, Pencil, Trash2, Search, CreditCard, ShieldCheck,
  Printer, CheckCircle2, XCircle, Info, ChevronUp, ChevronDown, Award
} from 'lucide-react';
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
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [viewModal, setViewModal] = useState({ open:false, data:null });
  const [paymentStatusModal, setPaymentStatusModal] = useState({ open:false, state:'idle', message:'' });
  const [saving, setSaving]     = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  
  // Upsell Option
  const [addInsurance, setAddInsurance] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'invoiceNumber', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [br, pr] = await Promise.all([billingService.getAll(), patientService.getAll()]);
      const data = br.data?.data ?? [];
      setBills(data);
      setPatients(pr.data?.data ?? []);
    } catch { toast.error('Failed to load billing records'); }
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

  // Filter & Sort Invoices
  const processedBills = useMemo(() => {
    let result = [...bills];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.patientName?.toLowerCase().includes(q) ||
        b.invoiceNumber?.toLowerCase().includes(q) ||
        b.paymentStatus?.toLowerCase().includes(q) ||
        b.paymentMethod?.toLowerCase().includes(q)
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
  }, [bills, search, sortConfig]);

  // Pagination Calculations
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedBills.slice(start, start + pageSize);
  }, [processedBills, currentPage, pageSize]);

  const totalPages = Math.ceil(processedBills.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
  }, [search]);

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

  // Razorpay Payment Flow
  const handlePayment = async (billId) => {
    setPayingId(billId);
    setPaymentStatusModal({ open: true, state: 'paying', message: 'Connecting to secure payment gateway...' });
    try {
      await paymentService.checkout(
        billId,
        (verifyData) => {
          setPaymentStatusModal({ open: true, state: 'success', message: 'Invoice paid successfully!' });
          load();
          setPayingId(null);
        },
        (errMsg) => {
          setPaymentStatusModal({ open: true, state: 'failure', message: errMsg || 'Payment failed.' });
          setPayingId(null);
        }
      );
    } catch (err) {
      setPaymentStatusModal({ open: true, state: 'failure', message: 'Could not initiate payment.' });
      setPayingId(null);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const totalRevenue = bills.filter(b => b.paymentStatus==='PAID').reduce((s,b) => s+(b.totalAmount||0), 0);
  const pending = bills.filter(b => b.paymentStatus==='PENDING' || b.paymentStatus==='OVERDUE').reduce((s,b) => s+(b.totalAmount||0), 0);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Layout pageTitle="Billing">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Billing & Invoicing</h1>
          <p>💰 Collected: ₹{totalRevenue.toLocaleString('en-IN')} · Pending: ₹{pending.toLocaleString('en-IN')}</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div className="search-box">
            <span className="search-icon"><Search size={15}/></span>
            <input placeholder="Search invoices…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button id="add-invoice-btn" className="btn btn-primary" onClick={openAdd}><Plus size={15}/>New Invoice</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-page"><div className="spinner"/>Loading invoices…</div>
        : processedBills.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3>No invoices found</h3>
            <p>Create a new billing invoice to get started</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper"><table>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}># {getSortIcon('id')}</th>
                  <th onClick={() => requestSort('invoiceNumber')}>Invoice {getSortIcon('invoiceNumber')}</th>
                  <th onClick={() => requestSort('patientName')}>Patient {getSortIcon('patientName')}</th>
                  <th onClick={() => requestSort('totalAmount')}>Total {getSortIcon('totalAmount')}</th>
                  <th onClick={() => requestSort('paymentStatus')}>Status {getSortIcon('paymentStatus')}</th>
                  <th onClick={() => requestSort('paymentDate')}>Date {getSortIcon('paymentDate')}</th>
                  <th onClick={() => requestSort('paymentMethod')}>Method {getSortIcon('paymentMethod')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedBills.map((b,i) => (
                <tr key={b.id}>
                  <td className="td-muted">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="td-muted">
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                      onClick={() => setViewModal({ open: true, data: b })}
                    >
                      {b.invoiceNumber ?? '—'}
                    </span>
                  </td>
                  <td><strong>{b.patientName}</strong></td>
                  <td><strong>₹{Number(b.totalAmount||0).toLocaleString('en-IN')}</strong></td>
                  <td><span className={`badge ${payBadge(b.paymentStatus)}`}>{b.paymentStatus?.replace('_',' ')}</span></td>
                  <td className="td-muted">{b.paymentDate ? new Date(b.paymentDate).toLocaleDateString() : '—'}</td>
                  <td className="td-muted">{b.paymentMethod || '—'}</td>
                  <td>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
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
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setViewModal({ open: true, data: b })} title="Print/View Invoice"><Printer size={14}/></button>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>openEdit(b)} title="Edit"><Pencil size={14}/></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm({open:true,id:b.id})} title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {Math.min(processedBills.length, (currentPage - 1) * pageSize + 1)} to {Math.min(processedBills.length, currentPage * pageSize)} of {processedBills.length} invoices
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

      {/* Invoice View & Print Modal */}
      {viewModal.open && viewModal.data && (
        <Modal 
          isOpen={viewModal.open} 
          onClose={() => setViewModal({ open: false, data: null })}
          title={`🧾 Invoice Detail - ${viewModal.data.invoiceNumber}`}
          size="modal-lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setViewModal({ open: false, data: null })}>Close</button>
              <button className="btn btn-primary" onClick={printInvoice}><Printer size={15}/>Print / Save PDF</button>
            </>
          }
        >
          <div className="printable-invoice" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: '850', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={20} className="text-primary" /> APEX HEALTH
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>12, Health Avenue, Medical Zone<br />Singapore 189423</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontWeight: '700' }}>INVOICE RECEIPT</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Invoice #: <strong>{viewModal.data.invoiceNumber}</strong><br />
                  Date: {viewModal.data.paymentDate ? new Date(viewModal.data.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}<br />
                  Status: <span className={`badge ${payBadge(viewModal.data.paymentStatus)}`} style={{ fontSize: '10px' }}>{viewModal.data.paymentStatus}</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Billed To:</h4>
                <p style={{ fontWeight: '700', marginTop: 4 }}>{viewModal.data.patientName}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Patient ID: #{viewModal.data.patientId}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method:</h4>
                <p style={{ fontWeight: '700', marginTop: 4 }}>{viewModal.data.paymentMethod || '—'}</p>
              </div>
            </div>

            <div className="table-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <th>Service / Item</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Consultation Fee</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(viewModal.data.consultationFee || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Room Charges</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(viewModal.data.roomCharges || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Medication Charges</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(viewModal.data.medicationCharges || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Other Charges</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(viewModal.data.otherCharges || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  {addInsurance && (
                    <tr>
                      <td style={{ color: 'var(--success)' }}>Premium Room Insurance Cover (Add-on)</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>₹450</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: '800', fontSize: '15px' }}>
                    <td>Total Invoice Value</td>
                    <td style={{ textAlign: 'right', color: 'var(--primary-400)' }}>
                      ₹{Number((viewModal.data.totalAmount || 0) + (addInsurance ? 450 : 0)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Upsell / Add-ons Section */}
            {(viewModal.data.paymentStatus === 'PENDING' || viewModal.data.paymentStatus === 'OVERDUE') && (
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99,102,241,0.2)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input 
                  type="checkbox" 
                  id="insurance-upsell" 
                  checked={addInsurance} 
                  onChange={(e) => setAddInsurance(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="insurance-upsell" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Add <span style={{ color: 'var(--primary-300)' }}>Premium Room Insurance Cover</span> (+₹450) to this billing cycle.
                </label>
              </div>
            )}

            {viewModal.data.notes && (
              <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: '12.5px', border: '1px solid var(--border)', marginBottom: 20 }}>
                <strong>Invoice Notes:</strong> {viewModal.data.notes}
              </div>
            )}

            <div className="invoice-footer">
              <p>Thank you for choosing Apex Health Systems. This is a computer-generated invoice receipt.</p>
              <p style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                <ShieldCheck size={12} className="text-success" /> HIPAA Compliant · Secured & Encrypted
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Razorpay Payment Status Feedback Modal */}
      {paymentStatusModal.open && (
        <Modal
          isOpen={paymentStatusModal.open}
          onClose={() => setPaymentStatusModal({ open: false, state: 'idle', message: '' })}
          title="Payment Processing"
          footer={
            <button 
              className="btn btn-secondary" 
              onClick={() => setPaymentStatusModal({ open: false, state: 'idle', message: '' })}
              disabled={paymentStatusModal.state === 'paying'}
            >
              Close
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 16 }}>
            {paymentStatusModal.state === 'paying' && (
              <>
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <p style={{ fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center' }}>{paymentStatusModal.message}</p>
                
                {/* Trust Badges */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} className="text-success" /> Secured by Razorpay</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} className="text-success" /> PCI-DSS Compliant</span>
                </div>
              </>
            )}
            {paymentStatusModal.state === 'success' && (
              <>
                <CheckCircle2 size={56} className="text-success" style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} />
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Payment Successful!</h3>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13.5px' }}>{paymentStatusModal.message}</p>
              </>
            )}
            {paymentStatusModal.state === 'failure' && (
              <>
                <XCircle size={56} className="text-danger" style={{ filter: 'drop-shadow(0 0 10px rgba(244,63,94,0.3))' }} />
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Payment Failed</h3>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13.5px' }}>{paymentStatusModal.message}</p>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Edit / Create Invoice Modal */}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={confirm.open} onClose={()=>setConfirm({open:false,id:null})} title="Delete Invoice"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-message">Permanently delete this invoice?</p>
      </Modal>
    </Layout>
  );
}
