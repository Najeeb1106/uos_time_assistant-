import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, ArrowRight, ArrowLeft, Sun, Moon, CheckCircle, Copy } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { devResetToken, resetUrl }
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const forgotPassword = useStore((state) => state.forgotPassword);
  const themeMode = useStore((state) => state.themeMode);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    document.body.classList.add('no-scrollbar');
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to send reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
      {/* Background Image / Video */}
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
            backgroundImage: 'url("/uos_bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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

      {/* Main Split Container */}
      <div className="auth-container animate-fade-in" style={{ zIndex: 10 }}>

        {/* Left Branding Panel */}
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

            {/* Back Button */}
            <button
              onClick={() => navigate('/login')}
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
              Back to Sign In
            </button>

            {!result ? (
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
                    <Mail size={24} color="#ffffff" />
                  </div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Forgot Password?
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.55 }}>
                    Enter your email address and we'll generate a secure reset token for you.
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
                  <div className="auth-input-group">
                    <label className="auth-input-label" htmlFor="forgot-email">Email Address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="auth-input-field"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="btn-pill-row" style={{ marginTop: '1.5rem' }}>
                    <button
                      type="submit"
                      className="btn-pill-primary"
                      disabled={isLoading}
                      style={{ flex: 1.4 }}
                    >
                      {isLoading ? 'Generating Token...' : (
                        <>Send Reset Token <ArrowRight size={16} /></>
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
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <div style={{
                    width: '60px', height: '60px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    borderRadius: '50%', margin: '0 auto 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)'
                  }}>
                    <CheckCircle size={28} color="#ffffff" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Token Generated!
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.55 }}>
                    Use the reset token below within <strong style={{ color: 'var(--warning)' }}>30 minutes</strong>.
                  </p>
                </div>

                {/* Dev Token Display Box */}
                {result.devResetToken && (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Your Reset Token (Dev Mode)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{
                        flex: 1,
                        fontSize: '0.7rem',
                        wordBreak: 'break-all',
                        color: 'var(--accent-primary)',
                        fontFamily: 'monospace',
                        lineHeight: 1.5
                      }}>
                        {result.devResetToken}
                      </code>
                      <button
                        onClick={() => handleCopy(result.devResetToken)}
                        title="Copy token"
                        style={{
                          background: copied ? 'rgba(34,197,94,0.12)' : 'var(--bg-secondary)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px', padding: '0.4rem 0.6rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          color: copied ? '#22c55e' : 'var(--text-secondary)',
                          transition: 'all 0.2s ease', flexShrink: 0
                        }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Proceed to Reset Button / Production Instructions */}
                {result.devResetToken ? (
                  <>
                    <div className="btn-pill-row" style={{ marginTop: '0.5rem' }}>
                      <button
                        className="btn-pill-primary"
                        style={{ flex: 1.4 }}
                        onClick={() => navigate(`/reset-password?token=${result.devResetToken || ''}`)}
                      >
                        Set New Password <ArrowRight size={16} />
                      </button>
                      <button
                        className="btn-pill-secondary"
                        onClick={() => navigate('/login')}
                      >
                        Sign In
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1.25rem', opacity: 0.7 }}>
                      ⚠️ In production, this token would be emailed securely instead of shown here.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ 
                      background: 'rgba(59, 130, 246, 0.06)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      marginBottom: '1.5rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      lineHeight: 1.55,
                      textAlign: 'justify'
                    }}>
                      📬 A secure password reset link has been dispatched to your email address. Please check your inbox (and spam folder) and follow the link inside the email to safely reset your password.
                    </div>
                    <div className="btn-pill-row" style={{ marginTop: '0.5rem' }}>
                      <button
                        className="btn-pill-primary"
                        style={{ flex: 1 }}
                        onClick={() => navigate('/login')}
                      >
                        Back to Sign In <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
