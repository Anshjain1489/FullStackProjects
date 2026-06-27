import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Hospital } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'ADMIN' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to Apex HMS.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Hospital size={26} color="#fff" /></div>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join Apex Hospital Management System</p>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,.3)',
            color: 'var(--danger)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', fontSize: '13px', marginBottom: '8px'
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input id="reg-username" className="form-control" type="text" name="username"
              placeholder="Choose a username" value={form.username} onChange={handleChange} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input id="reg-email" className="form-control" type="email" name="email"
              placeholder="your@email.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Role</label>
            <select id="reg-role" className="form-control" name="role" value={form.role} onChange={handleChange}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="password-toggle">
              <input id="reg-password" className="form-control" type={showPwd ? 'text' : 'password'}
                name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
              <button type="button" className="password-toggle-btn" onClick={() => setShowPwd(s => !s)} aria-label="Toggle password">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" id="register-submit-btn" className="auth-btn" disabled={loading}>
            {loading ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}><span className="spinner"/>Creating…</span> : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
