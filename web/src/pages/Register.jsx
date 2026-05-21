import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, Lock, User, GraduationCap, CalendarDays, ArrowRight, Sun, Moon } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [program, setProgram] = useState('BS in Software Engineering');
  const [type, setType] = useState('Regular');
  const [batch, setBatch] = useState('2024-2028');
  const [semester, setSemester] = useState('2');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const register = useStore((state) => state.register);
  const themeMode = useStore((state) => state.themeMode);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !fullName || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!email.endsWith('@uos.edu.pk')) {
      setError('Please use your official university email (e.g., username@uos.edu.pk)');
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(batch)) {
      setError('Session / Batch must be in YYYY-YYYY format (e.g., 2024-2028)');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, {
        fullName,
        program,
        type,
        batch,
        semester: Number(semester),
        password
      });
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Registration failed. User may already exist.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--auth-bg)',
      padding: '2.5rem 1.5rem',
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
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem 2rem',
        background: 'var(--auth-panel-bg)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/uos.png" alt="UOS Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            Create Student Profile
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Establish your academic details to align your parsed timetable
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Email */}
          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Official UOS Email</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
              <input 
                id="reg-email"
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="name@uos.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">Full Name</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
              <input 
                id="reg-name"
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Ahmed Ali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label className="input-label" htmlFor="reg-password">Security Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
              <input 
                id="reg-password"
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 0', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Program & Support Type */}
            <div className="register-row-grid-2col">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="program">Degree Program</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <GraduationCap size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', zIndex: 10 }} />
                  <select 
                    id="program"
                    className="input-field select-field" 
                    style={{ paddingLeft: '2.75rem' }}
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  >
                    <option value="BS in Software Engineering">BS Software Eng.</option>
                    <option value="BS in Computer Science">BS Computer Sci.</option>
                    <option value="BS in Information Technology">BS Info. Tech.</option>
                    <option value="MS in Software Engineering">MS Software Eng.</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Support Type</label>
                <div style={{ display: 'flex', gap: '0.35rem', height: '100%', alignItems: 'center' }}>
                  <button 
                    type="button"
                    className="btn"
                    style={{ 
                      flex: 1.2, 
                      padding: '0.65rem 0.25rem', 
                      fontSize: '0.8rem',
                      background: type === 'Regular' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: type === 'Regular' ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setType('Regular')}
                  >
                    Regular
                  </button>
                  <button 
                    type="button"
                    className="btn"
                    style={{ 
                      flex: 1, 
                      padding: '0.65rem 0.25rem', 
                      fontSize: '0.8rem',
                      background: type === 'Self Support 1' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: type === 'Self Support 1' ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setType('Self Support 1')}
                  >
                    Self 1
                  </button>
                  <button 
                    type="button"
                    className="btn"
                    style={{ 
                      flex: 1, 
                      padding: '0.65rem 0.25rem', 
                      fontSize: '0.8rem',
                      background: type === 'Self Support 2' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: type === 'Self Support 2' ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setType('Self Support 2')}
                  >
                    Self 2
                  </button>
                </div>
              </div>
            </div>

            {/* Batch & Semester */}
            <div className="register-row-grid-equal">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="batch">Session / Batch</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <CalendarDays size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', zIndex: 10 }} />
                  <input 
                    id="batch"
                    type="text" 
                    className="input-field" 
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="e.g. 2024-2028"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="semester">Active Semester</label>
                <select 
                  id="semester"
                  className="input-field select-field" 
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.95rem', borderRadius: '8px', marginTop: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Complete Registration <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have a profile?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
