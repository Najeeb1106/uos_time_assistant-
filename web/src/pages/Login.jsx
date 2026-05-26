import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, Lock, ArrowRight, Sun, Moon, GraduationCap, User, Rocket, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [teachingId, setTeachingId] = useState('');
  
  const login = useStore((state) => state.login);
  const themeMode = useStore((state) => state.themeMode);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.body.classList.add('no-scrollbar');
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (role === 'student' && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError('Please enter a valid email address.');
      return;
    }

    if (role === 'teacher' && !teachingId) {
      setError('Please enter your Faculty Teaching ID.');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password, role === 'teacher' ? teachingId : null);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Incorrect security password or user not registered.');
    }
  };

  return (
    <div className="no-scrollbar" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--auth-bg)',
      padding: '2.5rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Video with Dark/Light Ambient Filter Overlay */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      >
        <source src="/uos.mp4" type="video/mp4" />
      </video>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: themeMode === 'dark' ? 'rgba(6, 8, 20, 0.65)' : 'rgba(241, 245, 249, 0.55)',
        backdropFilter: 'blur(8px)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
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

      {/* Main Split Container */}
      <div className="auth-container animate-fade-in" style={{ zIndex: 10 }}>
        
        <div className="auth-left-panel">
          {/* Animated Ambient Blobs */}
          <div className="auth-ambient-blob blob-1"></div>
          <div className="auth-ambient-blob blob-2"></div>
          <div className="auth-ambient-blob blob-3"></div>

          <div className="auth-left-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
            <span className="auth-welcome-lbl" style={{ textAlign: 'center' }}>Welcome to</span>
            <div className="auth-brand-logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '1.5rem', width: '100%' }}>
              <img 
                src="/uos.png" 
                alt="UOS Logo" 
                className="auth-left-logo-animate"
                style={{ 
                  width: '72px', 
                  height: '72px', 
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0 4px 15px rgba(255, 255, 255, 0.35))'
                }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textAlign: 'center' }}>
                <h1 className="auth-brand-name" style={{ fontSize: '2.2rem', margin: 0, fontWeight: 800 }}>UOS</h1>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Smart Campus Timetable Assistant
                </span>
              </div>
            </div>
            <p className="auth-brand-desc" style={{ fontSize: '0.95rem', lineHeight: '1.65', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '340px', textAlign: 'justify', margin: '0 auto' }}>
              Navigate your academic day with absolute clarity. Track your schedules in real-time, discover unoccupied lecture halls instantly, and unlock effortless campus coordination built exclusively for UOS CS, SE, and IT.
            </p>
          </div>
          <div className="auth-left-footer">
            <span>UOS COMPUTING</span>
            <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>|</span>
            <span>DESIGN SYSTEM</span>
          </div>
        </div>

        {/* Cloudy Vector Wave Transition Divider */}
        <div className="auth-wave-divider">
          <svg viewBox="0 0 100 800" preserveAspectRatio="none" style={{ height: '100%', width: '100%', display: 'block' }}>
            <path className="auth-wave-layer-3" d="M100,0 L20,0 C20,0 40,100 10,200 C-20,300 30,400 10,500 C-10,600 40,700 20,800 L100,800 Z" />
            <path className="auth-wave-layer-2" d="M100,0 L30,0 C30,0 15,90 35,180 C55,270 25,360 45,450 C65,540 25,630 35,720 C45,800 35,800 35,800 L100,800 Z" />
            <path className="auth-wave-layer-1" d="M100,0 L45,0 C45,0 30,80 50,160 C70,240 40,320 60,400 C80,480 50,560 70,640 C90,720 55,800 55,800 L100,800 Z" />
          </svg>
        </div>

        {/* Right Form Input Panel */}
        <div className="auth-right-panel">
          <div className="auth-form-wrapper">
            
            {/* Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Sign In to UOS
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Enter your details to manage your schedule
              </p>
            </div>

            {/* Role Segmented Selector */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '0.25rem',
              marginBottom: '1.75rem',
              position: 'relative'
            }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: role === 'student' ? 'var(--accent-primary)' : 'transparent',
                  color: role === 'student' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => handleRoleChange('student')}
              >
                <GraduationCap size={15} />
                Student
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: role === 'teacher' ? 'var(--accent-primary)' : 'transparent',
                  color: role === 'teacher' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => handleRoleChange('teacher')}
              >
                <User size={15} />
                Teacher
              </button>
            </div>

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

            {/* Inputs Form */}
            <form onSubmit={handleSubmit}>
              
              {/* Teaching ID (Teacher Role Only) */}
              {role === 'teacher' && (
                <div className="auth-input-group animate-fade-in" style={{ marginBottom: '1.25rem' }}>
                  <label className="auth-input-label" htmlFor="teaching-id">Teaching ID</label>
                  <input 
                    id="teaching-id"
                    type="text" 
                    className="auth-input-field" 
                    placeholder="e.g. TCH-481"
                    value={teachingId}
                    onChange={(e) => setTeachingId(e.target.value)}
                  />
                </div>
              )}

              {/* Email Address */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  className="auth-input-field" 
                  placeholder={role === 'student' ? 'student@gmail.com' : 'teacher@gmail.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="password">Security Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    className="auth-input-field" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div style={{ textAlign: 'right', marginTop: '-0.75rem', marginBottom: '0.75rem' }}>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    opacity: 0.85,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.85'}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Keep Signed In Checkbox */}
              <div className="auth-checkbox-row">
                <input type="checkbox" id="keep-signed" className="auth-checkbox" defaultChecked />
                <label htmlFor="keep-signed" className="auth-checkbox-label">
                  By Signing In, I agree with Terms & Conditions
                </label>
              </div>

              {/* Pill Button Row */}
              <div className="btn-pill-row">
                <button 
                  type="submit" 
                  className="btn-pill-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : (
                    <>
                      Sign In <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-pill-secondary"
                  onClick={() => navigate('/register')}
                >
                  Sign Up
                </button>
              </div>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
