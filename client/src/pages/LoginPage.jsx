import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Train, Lock, Mail, ArrowRight, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email.trim(), password);
      addToast(`Welcome back, ${user.name}!`, 'success');

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'ADMIN') {
      setEmail('admin@example.com');
      setPassword('AdminPassword123');
    } else {
      setEmail('passenger@example.com');
      setPassword('DemoPassword123');
    }
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #eff6ff 100%)'
      }}
    >
      <div style={{ maxWidth: '450px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '16px',
              background: 'var(--accent-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
              marginBottom: '1rem'
            }}
          >
            <Train size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Railway Passenger Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.4rem' }}>
            Sign in to search trains, reserve berths, and track running status
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-xl)' }}>
          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                border: '1px solid var(--danger-border)',
                marginBottom: '1.25rem'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                <Mail size={15} color="var(--primary)" />
                <span>Email Address</span>
                <span className="required">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="passenger@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                <Lock size={15} color="var(--primary)" />
                <span>Password</span>
                <span className="required">*</span>
              </label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.85rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluator One-Click Fillers */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
              EVALUATOR QUICK SIGN-IN
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => fillDemo('PASSENGER')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.6rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', height: 'auto' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'var(--primary)' }}>
                  <UserCheck size={14} />
                  <span>Passenger</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priyadharshini M</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('ADMIN')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.6rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', height: 'auto' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'var(--warning)' }}>
                  <ShieldCheck size={14} />
                  <span>Administrator</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Operations Controller</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          New to RailPass?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
