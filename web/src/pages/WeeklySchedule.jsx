import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Info,
  X,
  Upload,
  BookOpen
} from 'lucide-react';

export default function WeeklySchedule() {
  const { classes } = useStore();
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [currentTimeString, setCurrentTimeString] = useState('');

  // Keep track of active system time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeString(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getClassesForDay = (day) => {
    return classes
      .filter((c) => c.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getTodayDay = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[new Date().getDay()];
  };

  const isClassOngoing = (cls) => {
    const today = getTodayDay();
    if (cls.day !== today) return false;
    return currentTimeString >= cls.startTime && currentTimeString <= cls.endTime;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Weekly timetable Grid</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Overview of all parsed lecture sequences for the current academic week.
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        /* Empty State */
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(99,102,241,0.08)', padding: '1.25rem', borderRadius: '24px', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
            <Calendar size={40} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Weekly view Unavailable</h3>
          <p style={{ maxWidth: '440px', margin: '0 auto 2rem auto', color: 'var(--text-secondary)' }}>
            There are no classes inside your database to construct the grid layout. Please upload your timetable file.
          </p>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} /> Upload PDF
          </Link>
        </div>
      ) : (
        /* Weekly Columns Grid */
        <div className="weekly-grid animate-fade-in" style={{ flex: 1, minHeight: '480px' }}>
          {days.map((day) => {
            const dayClasses = getClassesForDay(day);
            const isToday = day === getTodayDay();
            
            return (
              <div 
                key={day} 
                className="glass-panel"
                style={{ 
                  padding: '1.25rem 1rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  background: isToday ? 'rgba(99, 102, 241, 0.03)' : 'var(--glass-bg)',
                  borderColor: isToday ? 'rgba(99, 102, 241, 0.25)' : 'var(--glass-border)'
                }}
              >
                {/* Column header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderBottom: '1px solid var(--glass-border)', 
                  paddingBottom: '0.75rem' 
                }}>
                  <h3 style={{ 
                    fontWeight: 700, 
                    fontSize: '1.05rem', 
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)' 
                  }}>
                    {day}
                  </h3>
                  {isToday && (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: 'rgba(99, 102, 241, 0.15)', 
                      color: 'var(--accent-primary)', 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      TODAY
                    </span>
                  )}
                </div>

                {/* Column items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                  {dayClasses.length === 0 ? (
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--text-muted)', 
                      fontSize: '0.8rem',
                      padding: '2rem 0',
                      border: '1px dashed var(--bg-tertiary)',
                      borderRadius: '8px'
                    }}>
                      Free Day
                    </div>
                  ) : (
                    dayClasses.map((cls) => {
                      const ongoing = isClassOngoing(cls);
                      return (
                        <div
                          key={cls.classId}
                          onClick={() => setSelectedClass(cls)}
                          className="glass-panel"
                          style={{
                            padding: '0.85rem 1rem',
                            cursor: 'pointer',
                            background: ongoing ? 'var(--accent-glow)' : 'var(--glass-bg)',
                            borderColor: ongoing ? 'var(--accent-primary)' : 'var(--glass-border)',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '10px',
                            transition: 'var(--transition-fast)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = ongoing ? 'var(--accent-primary)' : 'var(--glass-border)';
                          }}
                        >
                          {ongoing && (
                            <span className="pulsing-glow" style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: 'var(--success)'
                            }}></span>
                          )}

                          <span style={{ 
                            fontSize: '0.65rem', 
                            color: ongoing ? 'var(--accent-secondary)' : 'var(--text-muted)', 
                            fontWeight: 700 
                          }}>
                            {cls.code}
                          </span>
                          <h4 style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            margin: '0.15rem 0 0.35rem 0',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            color: 'var(--text-primary)'
                          }} title={cls.name}>
                            {cls.name}
                          </h4>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Clock size={10} /> {cls.startTime}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <MapPin size={10} color="var(--accent-primary)" /> {cls.room}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Class detail modal */}
      {selectedClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }} onClick={() => setSelectedClass(null)}>
          <div 
            className="glass-panel animate-fade-in"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              background: 'var(--bg-secondary)',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedClass(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                {selectedClass.code}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                {selectedClass.type}
              </span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {selectedClass.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Clock size={18} color="var(--accent-primary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Day & Time</span>
                  <strong>{selectedClass.day} • {selectedClass.startTime} - {selectedClass.endTime}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <MapPin size={18} color="var(--accent-secondary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Room Location</span>
                  <strong>Lecture Hall {selectedClass.room}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <UserIcon size={18} color="var(--text-secondary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Instructor</span>
                  <strong>{selectedClass.teacher}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <BookOpen size={18} color="var(--text-muted)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Batch & Target</span>
                  <strong>{selectedClass.batch} • Semester {selectedClass.semester}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pulsing glow keyframes */}
      <style>{`
        .pulsing-glow {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 1.6s infinite cubic-bezier(0.66, 0, 0, 1);
        }
        @keyframes pulse {
          to {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  );
}
