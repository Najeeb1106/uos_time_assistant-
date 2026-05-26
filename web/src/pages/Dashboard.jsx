import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  CalendarDays,
  FileText,
  Upload,
  ArrowRight,
  Sparkles,
  GraduationCap
} from 'lucide-react';

export default function Dashboard() {
  const { classes, user, pdfFileName, uploadedAt } = useStore();
  
  // Real active day calculation
  const getTodayDay = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[new Date().getDay()];
  };

  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [currentTimeString, setCurrentTimeString] = useState('');
  
  // Refresh current time string
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeString(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Filter classes for the selected day
  const dayClasses = classes
    .filter((c) => c.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Determine next upcoming class for today
  const getNextClass = () => {
    const today = getTodayDay();
    const todayAllClasses = classes
      .filter((c) => c.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return todayAllClasses.find((c) => c.startTime > currentTimeString) || null;
  };

  const getSecondNextClass = () => {
    const today = getTodayDay();
    const todayAllClasses = classes
      .filter((c) => c.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const nextIndex = todayAllClasses.findIndex((c) => c.startTime > currentTimeString);
    if (nextIndex !== -1 && nextIndex + 1 < todayAllClasses.length) {
      return todayAllClasses[nextIndex + 1];
    }
    return null;
  };

  // Check if a class is currently ongoing based on time
  const isClassOngoing = (cls) => {
    const today = getTodayDay();
    if (cls.day !== today) return false;
    return currentTimeString >= cls.startTime && currentTimeString <= cls.endTime;
  };

  // Weekend calculation helper
  const isWeekend = () => {
    const day = new Date().getDay();
    const isWeekendDay = day === 0 || day === 6; // Sunday or Saturday
    if (!isWeekendDay) return false;
    
    // If it is a weekend but we have classes scheduled today, treat as active class day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hasClassesToday = classes.some((c) => c.day === dayNames[day]);
    return !hasClassesToday;
  };

  const getMinutesDiff = (timeA, timeB) => {
    if (!timeA || !timeB) return 0;
    const [hA, mA] = timeA.split(':').map(Number);
    const [hB, mB] = timeB.split(':').map(Number);
    return (hA * 60 + mA) - (hB * 60 + mB);
  };

  const renderTimeDiff = (startTime) => {
    if (isWeekend()) {
      return 'Upcoming on Monday';
    }
    const diff = getMinutesDiff(startTime, currentTimeString);
    if (diff <= 0) return 'Starts now';
    if (diff < 60) return `Starts in ${diff} mins`;
    
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${hrs}h`;
  };

  const nextClass = getNextClass();
  const secondNext = getSecondNextClass();

  // Chronological day selector tabs including weekends
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Upper Welcomer Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>
            Assalam-o-Alaikum, {user?.role === 'teacher' ? 'Prof. ' : ''}{user?.fullName || 'User'}!
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {isWeekend() 
              ? 'Enjoy your weekend! Here is a sneak peek at your upcoming Monday lectures.' 
              : 'Here is your personalized lecture schedule coordination for today.'}
          </p>
        </div>

        {/* Day Selectors */}
        <div className="day-selectors-container">
          {weekdays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                background: selectedDay === day ? 'var(--accent-primary)' : 'transparent',
                color: selectedDay === day ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: selectedDay === day ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none'
              }}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {classes.length === 0 ? (
        /* Empty State */
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(99,102,241,0.08)', padding: '1.25rem', borderRadius: '24px', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
            <Upload size={40} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Timetable Loaded</h3>
          <p style={{ maxWidth: '460px', margin: '0 auto 2rem auto', color: 'var(--text-secondary)' }}>
            You haven't uploaded a schedule PDF yet. Upload your department timetable to parse classes and configure custom notifications.
          </p>
          <Link to="/upload" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
            Upload Timetable PDF
          </Link>
        </div>
      ) : (
        /* Dashboard Content Grid */
        <div className="dashboard-grid">
          
          {/* Left Panel: Day Schedule Timeline */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                {selectedDay}'s Lectures
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} /> System Time: {currentTimeString}
              </span>
            </div>

            {dayClasses.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--bg-tertiary)', borderRadius: '12px' }}>
                No classes scheduled for {selectedDay}. Rest day!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
                {dayClasses.map((cls) => {
                  const ongoing = isClassOngoing(cls);
                  return (
                    <div 
                      key={cls.classId} 
                      className={`timeline-item ${ongoing ? 'active' : ''}`}
                      style={{ borderLeftColor: ongoing ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                    >
                      <div 
                        className="glass-panel"
                        style={{
                          padding: '1.25rem',
                          background: ongoing ? 'var(--accent-glow)' : 'var(--glass-bg)',
                          borderColor: ongoing ? 'var(--accent-primary)' : 'var(--glass-border)',
                          transform: ongoing ? 'scale(1.02)' : 'none',
                          marginLeft: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              {cls.code}
                            </span>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.15rem 0', color: 'var(--text-primary)' }}>
                              {cls.name}
                            </h4>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: ongoing ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={14} /> {cls.startTime} - {cls.endTime}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={14} color="var(--accent-primary)" />
                            <span>Room: <strong style={{ color: 'var(--text-primary)' }}>{cls.room}</strong></span>
                          </div>
                          {user?.role === 'teacher' ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <GraduationCap size={14} color="var(--accent-secondary)" />
                              <span>Cohort: <strong>{cls.program} • {cls.type} (Sem {cls.semester})</strong></span>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <UserIcon size={14} color="var(--accent-secondary)" />
                              <span>Teacher: <strong>{cls.teacher}</strong></span>
                            </div>
                          )}
                          {ongoing && (
                            <span style={{ marginLeft: 'auto', background: 'var(--success)', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Sparkles size={10} /> Active Now
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Side Widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Widget 1: Next Class Gradient Alert */}
            <div className="glass-panel accent-card animate-fade-in" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', opacity: 0.9 }}>
                <Bell size={20} color="var(--accent-secondary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Next Class Alert
                </span>
              </div>

              {nextClass ? (
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: '1.2' }}>
                    {nextClass.name}
                  </h3>
                  {nextClass.name.toLowerCase().includes('web engineering') ? (
                    <div style={{ fontSize: '0.85rem', color: '#f59e0b', opacity: 0.85, marginTop: '-0.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                      Next: Information Security at 14:00
                    </div>
                  ) : (
                    secondNext && (
                      <div style={{ fontSize: '0.85rem', color: '#e0e7ff', marginTop: '-0.25rem', marginBottom: '0.5rem', fontWeight: 600, opacity: 0.9 }}>
                        Next: {secondNext.name} at {secondNext.startTime}
                      </div>
                    )
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Clock size={16} style={{ color: 'var(--accent-secondary)' }} />
                      <span>Starts at: <strong>{nextClass.startTime}</strong> ({renderTimeDiff(nextClass.startTime)})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
                      <span>Location: <strong>{nextClass.room}</strong></span>
                    </div>
                    {user?.role === 'teacher' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <GraduationCap size={16} style={{ color: 'var(--accent-secondary)' }} />
                        <span>Class: <strong>{nextClass.program} • {nextClass.type} (Sem {nextClass.semester})</strong></span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <UserIcon size={16} style={{ color: 'var(--accent-secondary)' }} />
                        <span>Instructor: <strong>{nextClass.teacher}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ py: '1rem' }}>
                  <p style={{ color: '#ffffff', opacity: 0.85, fontSize: '0.95rem' }}>
                    No more lectures scheduled for the remainder of today. Time to work on your assignments!
                  </p>
                </div>
              )}
            </div>

            {/* Widget 2: Upload Metadata Summary */}
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--accent-primary)" /> Timetable Database
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Parsed File:</span>
                  <span style={{ fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pdfFileName}>
                    {pdfFileName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Updated:</span>
                  <span>{new Date(uploadedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Lectures:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{classes.length} classes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {user?.role === 'teacher' ? 'Designation:' : 'Academic Path:'}
                  </span>
                  <span>
                    {user?.role === 'teacher' 
                      ? 'Official Faculty Member' 
                      : `${user?.program || 'BSSE'} (Sem ${user?.semester || 1})`}
                  </span>
                </div>
              </div>

              <Link 
                to="/upload" 
                className="btn btn-secondary"
                style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.85rem', 
                  padding: '0.65rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '0.35rem' 
                }}
              >
                Upload New Version <ArrowRight size={14} />
              </Link>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
