import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  User, 
  Lock, 
  GraduationCap, 
  CalendarDays, 
  KeyRound, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  Info
} from 'lucide-react';

export default function Profile() {
  const { user, classes, updateProfile } = useStore();

  // Tab State
  const [activeTab, setActiveTab] = useState('academic');

  // Academic Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [program, setProgram] = useState(user?.program || 'BS in Software Engineering');
  const [type, setType] = useState(user?.type || 'Regular');
  const [batch, setBatch] = useState(user?.batch || '2024-2028');
  const [semester, setSemester] = useState(String(user?.semester || '2'));

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UX Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if user changes in store
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setProgram(user.program || 'BS in Software Engineering');
      setType(user.type || 'Regular');
      setBatch(user.batch || '2024-2028');
      setSemester(String(user.semester || '2'));
    }
  }, [user]);

  // Calculate live alignment warnings
  const isAlignmentChanged = 
    user && (
      semester !== String(user.semester) ||
      batch !== user.batch ||
      type !== user.type
    );

  // Calculate alignment health
  const totalClassesCount = classes?.length || 0;
  const alignedClassesCount = classes?.filter(cls => 
    cls.semester === Number(user?.semester) && 
    cls.batch === user?.batch && 
    cls.type === user?.type
  ).length || 0;

  const isFullyAligned = totalClassesCount === 0 || alignedClassesCount === totalClassesCount;

  // Retrieve user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Field Validations
    if (activeTab === 'academic') {
      if (!fullName.trim() || !batch.trim()) {
        setErrorMsg('Please fill in all required academic parameters.');
        return;
      }
      if (!/^\d{4}-\d{4}$/.test(batch.trim())) {
        setErrorMsg('Session / Batch must be in YYYY-YYYY format (e.g., 2024-2028).');
        return;
      }
    } else {
      if (!newPassword) {
        setErrorMsg('Please specify a new security password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Confirm password does not match new password.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName,
        program,
        type,
        batch,
        semester: Number(semester)
      };

      if (activeTab === 'security') {
        payload.password = newPassword;
      }

      const res = await updateProfile(payload);
      if (res.success) {
        setSuccessMsg(activeTab === 'security' 
          ? 'Security credentials successfully synchronized!' 
          : 'Student academic profile updated successfully!'
        );
        // Clear passwords if security tab was active
        if (activeTab === 'security') {
          setNewPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      console.error('Profile Save Error:', err);
      setErrorMsg(err.message || 'An error occurred while saving profile changes.');
    } finally {
      setIsLoading(false);
      // Auto-clear success message after 4s
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      
      {/* Response Toasts */}
      {successMsg && (
        <div 
          className="glass-panel animate-fade-in" 
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid var(--success)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--glass-bg) 100%)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
          }}
        >
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div 
          className="glass-panel animate-fade-in" 
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid var(--danger)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--glass-bg) 100%)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)'
          }}
        >
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual-Column Settings Portal */}
      <div className="profile-grid">
        
        {/* Left Column - Avatar Overview Card */}
        <div className="glass-panel profile-overview-card">
          {/* Circular Avatar Badge */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            color: '#ffffff',
            fontSize: '2.25rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            {getInitials(user?.fullName)}
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            {user?.fullName}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
            {user?.email}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginBottom: '2rem' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '8px',
              padding: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--accent-primary)',
              fontWeight: 600
            }}>
              {user?.program}
            </div>
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              {user?.type} • Semester {user?.semester}
            </div>
          </div>

          {/* Database Synchronization Status Indicator */}
          <div style={{
            width: '100%',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '1.5rem',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              System Coordination Status
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Parsed Lectures:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalClassesCount} classes</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Aligned Classes:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alignedClassesCount} classes</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.8rem',
                marginTop: '0.5rem',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                background: isFullyAligned ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${isFullyAligned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
                color: isFullyAligned ? 'var(--success)' : 'var(--warning)'
              }}>
                {isFullyAligned ? (
                  <>
                    <ShieldCheck size={16} />
                    <span>Healthy & Fully Aligned</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    <span>Coordinate Mismatch</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detail Form Panel */}
        <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
          
          {/* Premium Glassmorphic Tab Bar Selector */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            borderBottom: '1px solid var(--glass-border)', 
            paddingBottom: '1rem',
            marginBottom: '2rem' 
          }}>
            <button
              onClick={() => {
                setActiveTab('academic');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: activeTab === 'academic' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                border: activeTab === 'academic' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                color: activeTab === 'academic' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Academic Coordinates
            </button>
            
            <button
              onClick={() => {
                setActiveTab('security');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: activeTab === 'security' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                border: activeTab === 'security' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                color: activeTab === 'security' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Account Security
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Tab Panel 1: Academic Coordinates */}
            {activeTab === 'academic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
                
                {/* Full Name */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prof-name">Full Student Name</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                    <input 
                      id="prof-name"
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '2.75rem' }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Degree Program */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prof-program">Degree Program</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <GraduationCap size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', zIndex: 10 }} />
                    <select 
                      id="prof-program"
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

                {/* Session / Batch Text Input (Self-type, not dropdown) */}
                <div className="input-row-grid">
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="prof-batch">Session / Batch</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <CalendarDays size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                      <input 
                        id="prof-batch"
                        type="text" 
                        className="input-field" 
                        style={{ paddingLeft: '2.75rem' }}
                        placeholder="e.g. 2024-2028"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Active Semester */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="prof-semester">Active Semester</label>
                    <select 
                      id="prof-semester"
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

                {/* Support Type selector buttons */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Academic Support Cohort</label>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button 
                      type="button"
                      style={{ 
                        flex: 1.2, 
                        padding: '0.8rem 0.5rem', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: type === 'Regular' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: type === 'Regular' ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${type === 'Regular' ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: type === 'Regular' ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setType('Regular')}
                    >
                      Regular
                    </button>
                    
                    <button 
                      type="button"
                      style={{ 
                        flex: 1, 
                        padding: '0.8rem 0.5rem', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: type === 'Self Support 1' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: type === 'Self Support 1' ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${type === 'Self Support 1' ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: type === 'Self Support 1' ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setType('Self Support 1')}
                    >
                      Self 1
                    </button>
                    
                    <button 
                      type="button"
                      style={{ 
                        flex: 1, 
                        padding: '0.8rem 0.5rem', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: type === 'Self Support 2' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: type === 'Self Support 2' ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${type === 'Self Support 2' ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: type === 'Self Support 2' ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setType('Self Support 2')}
                    >
                      Self 2
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Tab Panel 2: Account Security */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  padding: '1rem',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>Update your password credentials below. Your new credentials will be immediately validated against your secure local database or remote auth structures.</span>
                </div>

                {/* New Password */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prof-new-pass">New Security Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                    <input 
                      id="prof-new-pass"
                      type="password" 
                      className="input-field" 
                      style={{ paddingLeft: '2.75rem' }}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prof-confirm-pass">Confirm Security Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                    <input 
                      id="prof-confirm-pass"
                      type="password" 
                      className="input-field" 
                      style={{ paddingLeft: '2.75rem' }}
                      placeholder="Repeat security password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Live Warning Panel: Sliding Glassmorphic Warn Banner if coordinate alignments are changed */}
            {activeTab === 'academic' && isAlignmentChanged && (
              <div 
                className="glass-panel animate-fade-in" 
                style={{
                  padding: '1.25rem 1.5rem',
                  borderLeft: '4px solid var(--warning)',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--glass-bg) 100%)',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem'
                }}
              >
                <div style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Coordinate Alignment Shift
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', lineHeight: '1.4' }}>
                    Warning: Changing your academic alignment details (Semester, Batch, or Support Type) will mismatch your existing parsed schedule. You will need to re-upload your department timetable PDF to align your courses.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                background: isAlignmentChanged 
                  ? 'linear-gradient(135deg, var(--warning), var(--accent-secondary))' 
                  : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                boxShadow: isAlignmentChanged 
                  ? '0 4px 15px rgba(245, 158, 11, 0.2)' 
                  : '0 4px 15px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.3s ease'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Synchronizing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{activeTab === 'security' ? 'Update Credentials' : 'Save Academic Changes'}</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
