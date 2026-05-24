import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, Lock, User, GraduationCap, CalendarDays, ArrowRight, Sun, Moon } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [program, setProgram] = useState('BS in Software Engineering');
  const [type, setType] = useState('Regular');
  const [batch, setBatch] = useState('2024-2028');
  const [semester, setSemester] = useState('2');
  
  // Teacher-specific registration states
  const [department, setDepartment] = useState('Software Engineering');
  const [designation, setDesignation] = useState('Lecturer');
  const [employeeId, setEmployeeId] = useState('');
  const [facultyKey, setFacultyKey] = useState('');
  
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

    if (role === 'student' && !/^\d{4}-\d{4}$/.test(batch)) {
      setError('Session / Batch must be in YYYY-YYYY format (e.g., 2024-2028)');
      return;
    }

    if (role === 'teacher') {
      if (!department || !designation || !employeeId || !facultyKey) {
        setError('Please fill in all faculty details including Faculty ID and Security Key');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName,
        password,
        role
      };

      if (role === 'student') {
        payload.program = program;
        payload.type = type;
        payload.batch = batch;
        payload.semester = Number(semester);
      } else {
        payload.department = department;
        payload.designation = designation;
        payload.employeeId = employeeId;
        payload.facultyKey = facultyKey;
      }

      await register(email, payload);
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/uos.png" alt="UOS Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            {role === 'student' ? 'Create Student Profile' : 'Create Teacher Profile'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {role === 'student' 
              ? 'Establish your academic details to align your parsed timetable' 
              : 'Enter your name and official UOS email to custom filter your teaching schedule'}
          </p>
        </div>

        {/* Role Selector Segmented Control */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '0.25rem',
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: role === 'student' ? 'var(--accent-primary)' : 'transparent',
              color: role === 'student' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onClick={() => setRole('student')}
          >
            <GraduationCap size={16} />
            Student
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: role === 'teacher' ? 'var(--accent-primary)' : 'transparent',
              color: role === 'teacher' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onClick={() => setRole('teacher')}
          >
            <User size={16} />
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
                placeholder={role === 'student' ? "name@uos.edu.pk" : "teacher@uos.edu.pk"}
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
                placeholder={role === 'student' ? "Ahmed Ali" : "Dr. Afzal Badshah"}
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

          {role === 'student' && (
            <div className="animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 0', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          )}

          {role === 'teacher' && (
            <div className="animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 0', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Department & Designation */}
              <div className="register-row-grid-equal">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="department">Department</label>
                  <select 
                    id="department"
                    className="input-field select-field"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Computer Science & IT">CS & IT</option>
                    <option value="Software Engineering">Software Eng.</option>
                    <option value="Information Technology">Info. Tech.</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="designation">Designation</label>
                  <select 
                    id="designation"
                    className="input-field select-field"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Prof.</option>
                    <option value="Assistant Professor">Assistant Prof.</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
              </div>

              {/* Employee ID & Security Key */}
              <div className="register-row-grid-equal">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="employee-id">Faculty Employee ID</label>
                  <input 
                    id="employee-id"
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. EMP-9921"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="faculty-key">Security Access Key</label>
                  <input 
                    id="faculty-key"
                    type="password" 
                    className="input-field" 
                    placeholder="Enter UOS Secret Key"
                    value={facultyKey}
                    onChange={(e) => setFacultyKey(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

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
