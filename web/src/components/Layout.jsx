import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Calendar, 
  DoorOpen,
  UploadCloud, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User,
  Sparkles,
  Check,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    isSidebarOpen, 
    toggleSidebar,
    parsedClasses,
    parseStep,
    parseFileName,
    uploadSchedule,
    themeMode,
    toggleTheme
  } = useStore();

  const [isSaving, setIsSaving] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    // If screen size becomes mobile and sidebar is open, close it to avoid taking over the display
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  }, [isMobile]);

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await uploadSchedule(parseFileName || 'timetable.pdf', parsedClasses);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save timetable: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Weekly Schedule', path: '/schedule', icon: Calendar },
    { name: 'Free Rooms', path: '/free-rooms', icon: DoorOpen },
    { name: 'Upload PDF', path: '/upload', icon: UploadCloud },
    { name: 'Profile Settings', path: '/profile', icon: Settings }
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard Overview';
      case '/schedule': return 'Weekly timetable Grid';
      case '/free-rooms': return 'Free Room Finder';
      case '/upload': return 'Timetable Parsing engine';
      case '/profile': return user?.role === 'teacher' ? 'Instructor Profile Settings' : 'Student Profile Settings';
      default: return 'UOS Timetable';
    }
  };

  // If user is not authenticated, render without sidebar (for login/register pages)
  if (!user) {
    return <div className="min-h-screen bg-primary">{children}</div>;
  }

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 90,
            transition: 'var(--transition-normal)'
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className="glass-panel" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: isMobile ? (isSidebarOpen ? '0' : '-280px') : '0',
          width: isMobile ? 'var(--sidebar-width)' : (isSidebarOpen ? 'var(--sidebar-width)' : '80px'),
          zIndex: 100,
          borderRadius: 0,
          borderLeft: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          padding: '1.5rem 1rem',
          transition: 'var(--transition-normal)',
          boxShadow: isMobile && !isSidebarOpen ? 'none' : '0 8px 32px 0 var(--glass-shadow)'
        }}
      >
        {/* Brand Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          marginBottom: '2.5rem',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <img src="/uos.png" alt="UOS Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          {isSidebarOpen && (
            <span style={{ 
              fontWeight: 800, 
              fontSize: '1.25rem', 
              background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              UOS Timetable
            </span>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={() => {
                  if (isMobile && isSidebarOpen) {
                    toggleSidebar();
                  }
                }}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : 'none',
                  paddingLeft: isActive ? 'calc(1rem - 3px)' : '1rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Icon size={20} style={{ minWidth: '20px' }} />
                {(isSidebarOpen || isMobile) && <span style={{ fontSize: '0.95rem' }}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Profile / Logout) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
          {isSidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border)'
              }}>
                <User size={16} color="var(--text-secondary)" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.role === 'teacher' ? 'UOS Faculty Member' : `${user.semester} Semester • ${user.type}`}
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="nav-link"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              color: '#ef4444',
              transition: 'var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={20} style={{ minWidth: '20px' }} />
            {isSidebarOpen && <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        style={{ 
          flex: 1, 
          marginLeft: isMobile ? '0' : (isSidebarOpen ? 'var(--sidebar-width)' : '80px'),
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'var(--transition-normal)'
        }}
      >
        {/* Top Header */}
        <header 
          className="glass-panel" 
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 1rem' : '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            borderRadius: 0,
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            background: 'var(--header-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={toggleSidebar}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '0.45rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-fast)'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <Menu size={18} />
            </button>
            <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getPageTitle()}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Premium Theme Toggle Button */}
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
                position: 'relative',
                overflow: 'hidden'
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
                <Sun size={18} color="var(--warning)" style={{ transition: 'transform 0.5s ease' }} />
              ) : (
                <Moon size={18} color="var(--accent-primary)" style={{ transition: 'transform 0.5s ease' }} />
              )}
            </button>

            {!isMobile && (
              <div style={{
                background: user.role === 'teacher' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                border: user.role === 'teacher' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '20px',
                padding: '0.25rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: user.role === 'teacher' ? 'var(--success)' : 'var(--accent-primary)',
                letterSpacing: '0.02em'
              }}>
                {user.role === 'teacher' ? 'Faculty' : user.program}
              </div>
            )}
          </div>
        </header>

        {/* Notice Alert Banner */}
        {parseStep === 'preview' && parsedClasses.length > 0 && location.pathname !== '/upload' && (
          <div 
            className="glass-panel animate-fade-in" 
            style={{
              margin: isMobile ? '1rem 1rem 0 1rem' : '1.5rem 2rem 0 2rem',
              padding: isMobile ? '1rem' : '1rem 1.5rem',
              borderLeft: '4px solid var(--warning)',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? '1rem' : '1.5rem',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--glass-bg) 100%)',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: isMobile ? 'auto' : '240px' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--warning)',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
                flexShrink: 0
              }}>
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Unconfirmed Timetable Found!
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0', lineHeight: 1.4 }}>
                  We successfully parsed <strong>{parsedClasses.length} lectures</strong> from <em>{parseFileName || 'timetable.pdf'}</em>. Save it now to activate your dashboard.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: isMobile ? 'flex-end' : 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/upload')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flex: isMobile ? 1 : 'none' }}
                disabled={isSaving}
              >
                Review
              </button>
              <button 
                onClick={handleConfirmSave}
                className="btn btn-primary"
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.45rem 1.25rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem',
                  background: 'linear-gradient(135deg, var(--warning), var(--accent-secondary))',
                  boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)',
                  flex: isMobile ? 1 : 'none'
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Confirm & Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content Body Router Slot */}
        <main style={{ padding: isMobile ? '1rem' : '2rem', flex: 1, minHeight: 'calc(100vh - var(--header-height))', display: 'flex', flexDirection: 'column' }}>
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
