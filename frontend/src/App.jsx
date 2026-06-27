import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import AudioDashboard from './components/AudioDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check active database session on app load
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(err => console.error('Session check error:', err))
      .finally(() => setAuthChecked(true));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        user={user} 
        setUser={setUser} 
        onOpenAuth={() => setIsAuthOpen(true)} 
      />

      <main style={{ flex: 1 }}>
        <AudioDashboard 
          user={user} 
          onOpenAuth={() => setIsAuthOpen(true)} 
        />
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        user={user} 
        setUser={setUser} 
      />

      <footer style={{
        textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: '0.875rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '3rem'
      }}>
        © {new Date().getFullYear()} Audiofy AI. Powered by React, SQLite, & Speech Intelligence.
      </footer>
    </div>
  );
}
