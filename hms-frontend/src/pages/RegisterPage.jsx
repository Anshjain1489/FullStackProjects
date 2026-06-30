import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Hospital, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'ADMIN' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setApiError('');
    if (errors[name]) setErrors(errs => ({ ...errs, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!form.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Please fill in all fields correctly'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to Apex HMS.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel" style={{ background: 'rgba(15, 23, 42, 0.45)' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon"><Hospital size={26} color="#fff" /></div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Join Apex Hospital Management System</p>

        {apiError && (
          <div style={{
            background: 'var(--danger-bg)', 
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)', 
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px', 
            fontSize: '13px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input 
              id="reg-username" 
              className={`form-control ${errors.username ? 'is-invalid' : ''}`} 
              type="text" 
              name="username"
              placeholder="Choose a username" 
              value={form.username} 
              onChange={handleChange} 
              autoFocus 
            />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input 
              id="reg-email" 
              className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
              type="email" 
              name="email"
              placeholder="your@email.com" 
              value={form.email} 
              onChange={handleChange} 
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
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
              <input 
                id="reg-password" 
                className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                type={showPwd ? 'text' : 'password'}
                name="password" 
                placeholder="Min. 6 characters" 
                value={form.password} 
                onChange={handleChange} 
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPwd(s => !s)} 
                aria-label="Toggle password"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" id="register-submit-btn" className="auth-btn" disabled={loading}>
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                <span className="spinner"/>Creating…
              </span>
            ) : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
