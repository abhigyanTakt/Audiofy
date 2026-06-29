import React from 'react';
import { Mic, User, LogOut, LogIn, Sparkles } from 'lucide-react';

export default function Navbar({ user, setUser, onOpenAuth }) {
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <nav className="glass-panel" style={{
      margin: '1.5rem 2rem 0 2rem', padding: '1rem 2rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: '20px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px 0 var(--primary-glow)'
        }}>
          <Mic size={22} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
            Audiofy
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px'
          }}>
            AI Voice Studio
          </span>
        </div>
      </div>

      {/* Auth Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '0.8rem'
              }}>
                {user.username ? user.username[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f3f4f6' }}>
                {user.username}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={onOpenAuth} className="btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>
              <LogIn size={16} /> Sign In
            </button>
            <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>
              <Sparkles size={16} /> Sign Up Free
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
