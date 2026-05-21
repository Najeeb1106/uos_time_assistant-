import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, Lock, ArrowRight, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('student@uos.edu.pk');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useStore((state) => state.login);
  const themeMode = useStore((state) => state.themeMode);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.endsWith('@uos.edu.pk')) {
      setError('Please use a valid university email (e.g., student@uos.edu.pk)');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Incorrect security password or user not registered.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--auth-bg)',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            padding: '0.5rem',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px var(--glass-shadow)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.boxShadow = '0 0 15px var(--accent-glow)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.boxShadow = '0 4px 12px var(--glass-shadow)';
          }}
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {themeMode === 'dark' ? (
            <Sun size={18} color="var(--warning)" />
          ) : (
            <Moon size={18} color="var(--accent-primary)" />
          )}
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        background: 'var(--auth-panel-bg)'
      }}>
        {/* Brand Header */}
        <img src="/uos.png" alt="UOS Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '1.25rem' }} />
        
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
          Welcome Back
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Sign in to access your UOS schedule
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">UOS Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
              <input 
                id="email"
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="student@uos.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="password">Security Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
              <input 
                id="password"
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.95rem', borderRadius: '8px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Sign In <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
