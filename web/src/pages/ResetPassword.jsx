import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Lock, ArrowRight, ArrowLeft, Sun, Moon, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const resetPassword = useStore((state) => state.resetPassword);
  const themeMode = useStore((state) => state.themeMode);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  // Password strength helpers
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    return { score, label: 'Strong', color: '#22c55e' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Please enter the reset token you received.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setIsLoading(false);
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
      {/* Background Video */}
      {isVideoLoaded ? (
        <video autoPlay loop muted playsInline style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0, pointerEvents: 'none'
        }}>
          <source src="/uos.mp4" type="video/mp4" />
        </video>
      ) : (
        <div
          onClick={() => setIsVideoLoaded(true)}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: '#1e293b', zIndex: 0, cursor: 'pointer'
          }}
        />
      )}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        background: themeMode === 'dark' ? 'rgba(6, 8, 20, 0.65)' : 'rgba(241, 245, 249, 0.55)',
        backdropFilter: 'blur(8px)',
        zIndex: 1, pointerEvents: 'none'
      }} />

      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px var(--glass-shadow)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {themeMode === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
        </button>
      </div>

      {/* Main Container */}
      <div className="auth-container animate-fade-in" style={{ zIndex: 10 }}>

        {/* Left Panel */}
        <div className="auth-left-panel">
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
                style={{ width: '72px', height: '72px', objectFit: 'contain', filter: 'drop-shadow(0 4px 15px rgba(255, 255, 255, 0.35))' }}
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

        {/* Wave Divider */}
        <div className="auth-wave-divider">
          <svg viewBox="0 0 100 800" preserveAspectRatio="none" style={{ height: '100%', width: '100%', display: 'block' }}>
            <path className="auth-wave-layer-3" d="M100,0 L20,0 C20,0 40,100 10,200 C-20,300 30,400 10,500 C-10,600 40,700 20,800 L100,800 Z" />
            <path className="auth-wave-layer-2" d="M100,0 L30,0 C30,0 15,90 35,180 C55,270 25,360 45,450 C65,540 25,630 35,720 C45,800 35,800 35,800 L100,800 Z" />
            <path className="auth-wave-layer-1" d="M100,0 L45,0 C45,0 30,80 50,160 C70,240 40,320 60,400 C80,480 50,560 70,640 C90,720 55,800 55,800 L100,800 Z" />
          </svg>
        </div>

        {/* Right Form Panel */}
        <div className="auth-right-panel">
          <div className="auth-form-wrapper">

            {/* Back */}
            <button
              onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--text-secondary)', fontSize: '0.85rem',
                fontWeight: 500, padding: '0', marginBottom: '1.75rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <ArrowLeft size={15} />
              Back
            </button>

            {!success ? (
              <>
                {/* Header */}
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                  <div style={{
                    width: '52px', height: '52px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    borderRadius: '16px', margin: '0 auto 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px var(--accent-glow)'
                  }}>
                    <Lock size={24} color="#ffffff" />
                  </div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Set New Password
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.55 }}>
                    Enter the reset token and choose a strong new password.
                  </p>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px', fontSize: '0.85rem',
                    marginBottom: '1.5rem', textAlign: 'left'
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Reset Token Field */}
                  <div className="auth-input-group">
                    <label className="auth-input-label" htmlFor="reset-token">Reset Token</label>
                    <input
                      id="reset-token"
                      type="text"
                      className="auth-input-field"
                      placeholder="Paste your reset token here"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: '0.78rem', letterSpacing: '0.03em' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      Paste the token from the previous step or from your email.
                    </span>
                  </div>

                  {/* New Password */}
                  <div className="auth-input-group">
                    <label className="auth-input-label" htmlFor="new-password">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        className="auth-input-field"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ paddingRight: '2.75rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                          padding: 0
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {newPassword && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '3px', marginBottom: '0.3rem' }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} style={{
                              flex: 1, height: '3px', borderRadius: '2px',
                              background: i <= strength.score ? strength.color : 'var(--glass-border)',
                              transition: 'background 0.3s ease'
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600 }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="auth-input-group">
                    <label className="auth-input-label" htmlFor="confirm-password">Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        className="auth-input-field"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          paddingRight: '2.75rem',
                          borderColor: confirmPassword && confirmPassword !== newPassword
                            ? 'rgba(239,68,68,0.5)'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'rgba(34,197,94,0.5)'
                            : undefined
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        style={{
                          position: 'absolute', right: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                          padding: 0
                        }}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <span style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '0.25rem', display: 'block' }}>
                        Passwords do not match
                      </span>
                    )}
                  </div>

                  <div className="btn-pill-row" style={{ marginTop: '1.5rem' }}>
                    <button
                      type="submit"
                      className="btn-pill-primary"
                      disabled={isLoading}
                      style={{ flex: 1.4 }}
                    >
                      {isLoading ? 'Resetting...' : (
                        <>Reset Password <ArrowRight size={16} /></>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-pill-secondary"
                      onClick={() => navigate('/login')}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{
                  width: '72px', height: '72px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  borderRadius: '50%', margin: '0 auto 1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 12px 32px rgba(34, 197, 94, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  <CheckCircle size={36} color="#ffffff" />
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                  Password Reset!
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '2rem' }}>
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>

                <button
                  className="btn-pill-primary"
                  style={{ width: '100%' }}
                  onClick={() => navigate('/login')}
                >
                  Sign In Now <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
