import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, user, setUser }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const endpoint = mode === 'login' ? '/api/login' : '/api/signup';
    const payload = mode === 'login' 
      ? { email: formData.email, password: formData.password } 
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message);
        setUser(data.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network error. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '440px', padding: '2rem',
        position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)'
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer'
        }}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            color: '#818cf8', marginBottom: '0.75rem'
          }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }} className="gradient-text">
            {mode === 'login' ? 'Welcome Back to Audiofy' : 'Create Audiofy Account'}
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {mode === 'login' ? 'Sign in to access stored transcripts & AI tools' : 'Store your audio data & transcriptions securely'}
          </p>
        </div>

        {/* Toggle Tabs */}
        <div style={{
          display: 'flex', background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px', padding: '4px', marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s',
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : '#9ca3af'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s',
              background: mode === 'signup' ? 'var(--primary)' : 'transparent',
              color: mode === 'signup' ? '#fff' : '#9ca3af'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px',
            color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem'
          }}>
            <AlertCircle size={18} shrink={0} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px',
            color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1rem'
          }}>
            <CheckCircle size={18} shrink={0} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.35rem' }}>
                USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  style={{
                    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.35rem' }}>
              EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.35rem' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem'
            }}
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? (
                <> <LogIn size={18} /> Sign In </>
              ) : (
                <> <UserPlus size={18} /> Create Account </>
              )
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
