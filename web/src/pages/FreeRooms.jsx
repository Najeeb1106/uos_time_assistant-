import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import staticTimetableClasses from '../assets/parsed_timetable.json';
import { 
  Search, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Filter,
  MapPin,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function FreeRooms() {
  const { themeMode, token } = useStore();
  
  // Day and Time states
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedTime, setSelectedTime] = useState('08:30');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('All'); // 'All', 'Classrooms', 'Labs'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Free', 'Occupied'
  const [expandedRoom, setExpandedRoom] = useState(null);

  // Dynamic Global Timetable State
  const [allClasses, setAllClasses] = useState(staticTimetableClasses);
  const [globalPdfName, setGlobalPdfName] = useState(null);
  const [globalUploadedAt, setGlobalUploadedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Initialize with current day and time on mount
  useEffect(() => {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    
    setSelectedDay(currentDay);

    // Format current time as HH:MM
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hrs}:${mins}`);
  }, []);

  // Fetch global parsed schedule from backend if user is logged in
  useEffect(() => {
    async function fetchGlobalTimetable() {
      if (!token || token === 'mock-jwt-session-token') {
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/schedule/global`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.classes && data.classes.length > 0) {
          setAllClasses(data.classes);
          setGlobalPdfName(data.pdfFileName);
          setGlobalUploadedAt(data.uploadedAt);
          console.log(`[FreeRooms] Successfully loaded dynamic global timetable with ${data.classes.length} classes.`);
        }
      } catch (err) {
        console.error('[FreeRooms] Failed to fetch dynamic global timetable, using static fallback:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGlobalTimetable();
  }, [token]);

  // Reset day and time to current system time
  const handleResetToNow = () => {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    
    setSelectedDay(currentDay);

    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hrs}:${mins}`);
  };

  // Get unique rooms from the parsed timetable
  const uniqueRooms = React.useMemo(() => {
    return Array.from(new Set(allClasses.map(c => c.room)))
      .filter(room => room && room !== 'Unknown' && room.trim() !== '')
      .sort((a, b) => a.localeCompare(b));
  }, [allClasses]);

  // Determine room categories
  const isLab = (roomName) => {
    const name = roomName.toLowerCase();
    return name.includes('lab') || name.includes('l-') || name.includes('l0');
  };

  // Compute room status at the selected day and time
  const roomStatuses = React.useMemo(() => {
    return uniqueRooms.map(room => {
      // Find all classes in this room on the selected day
      const roomDayClasses = allClasses.filter(c => c.room === room && c.day === selectedDay);
      
      // Sort chronologically
      const sortedClasses = [...roomDayClasses].sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Find if there is an active class right now
      const activeClass = sortedClasses.find(c => {
        return selectedTime >= c.startTime && selectedTime < c.endTime;
      });

      // Find the next class that will take place today after selectedTime
      const nextClass = sortedClasses.find(c => c.startTime > selectedTime);

      return {
        room,
        isFree: !activeClass,
        activeClass,
        nextClass,
        todayClassesCount: sortedClasses.length,
        schedule: sortedClasses,
        category: isLab(room) ? 'Labs' : 'Classrooms'
      };
    });
  }, [uniqueRooms, selectedDay, selectedTime, allClasses]);

  // Filtered rooms to display
  const displayedRooms = React.useMemo(() => {
    return roomStatuses.filter(item => {
      // Search query
      const matchesSearch = item.room.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = roomFilter === 'All' || item.category === roomFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Free' && item.isFree) || 
        (statusFilter === 'Occupied' && !item.isFree);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [roomStatuses, searchQuery, roomFilter, statusFilter]);

  // Count stats
  const totalRooms = roomStatuses.length;
  const freeRoomsCount = roomStatuses.filter(r => r.isFree).length;
  const occupiedRoomsCount = totalRooms - freeRoomsCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      
      {/* Header section with real-time stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              Free Room Finder <Sparkles size={22} color="var(--warning)" className="animate-pulse" />
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Scan and locate unoccupied lecture halls and laboratories across the department in real-time.
            </p>
            {isLoading && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                Loading dynamic timetable...
              </span>
            )}
            {globalPdfName && !isLoading && (
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 650, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                marginTop: '0.5rem', 
                background: 'rgba(99, 102, 241, 0.08)', 
                color: 'var(--accent-primary)', 
                border: '1px solid rgba(99, 102, 241, 0.2)', 
                padding: '0.25rem 0.65rem', 
                borderRadius: '6px' 
              }}>
                📂 Dynamic Timetable: {globalPdfName}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleResetToNow}
            className="btn btn-secondary"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.85rem',
              padding: '0.5rem 1rem'
            }}
          >
            <RotateCcw size={14} /> Use Current Time
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Total Rooms Card */}
          <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'var(--glass-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--accent-primary)',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.05)'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Rooms</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalRooms}</strong>
            </div>
          </div>

          {/* Free Rooms Card */}
          <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--glass-bg) 100%)',
            borderLeft: '4px solid var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.05)'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Free Right Now</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{freeRoomsCount}</strong>
            </div>
          </div>

          {/* Occupied Rooms Card */}
          <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--glass-bg) 100%)',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(239, 68, 68, 0.05)'
            }}>
              <XCircle size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupied Now</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{occupiedRoomsCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Control panel & filters */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          
          {/* Day selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} color="var(--accent-primary)" /> Day of the Week
            </label>
            <select 
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="glass-panel"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {days.map(d => (
                <option key={d} value={d} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{d}</option>
              ))}
            </select>
          </div>

          {/* Time input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} color="var(--accent-secondary)" /> Search Time
            </label>
            <input 
              type="time" 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="glass-panel"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Room Type select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={14} color="var(--accent-primary)" /> Room Type
            </label>
            <div style={{ display: 'flex', gap: '0.25rem', height: '100%' }}>
              {['All', 'Classrooms', 'Labs'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setRoomFilter(filter)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: roomFilter === filter ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    color: roomFilter === filter ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderColor: roomFilter === filter ? 'var(--accent-primary)' : 'var(--glass-border)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Status select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={14} color="var(--success)" /> Occupancy
            </label>
            <div style={{ display: 'flex', gap: '0.25rem', height: '100%' }}>
              {['All', 'Free', 'Occupied'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: statusFilter === filter ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: statusFilter === filter ? 'var(--success)' : 'var(--text-secondary)',
                    borderColor: statusFilter === filter ? 'var(--success)' : 'var(--glass-border)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Text search input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search rooms by name (e.g. CR- 224, Lab, L-03, Pharmacy)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-panel"
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {/* Grid listing rooms */}
      {displayedRooms.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)' }}>
          <Search size={40} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No rooms matched your criteria</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
            Try adjusting your search keywords or setting the status/type filters to 'All' to explore more spaces.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {displayedRooms.map(({ room, isFree, activeClass, nextClass, todayClassesCount, schedule, category }) => {
            const isExpanded = expandedRoom === room;

            return (
              <div 
                key={room}
                className="glass-panel animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isFree ? 'var(--glass-bg)' : 'linear-gradient(180deg, var(--glass-bg) 0%, rgba(239, 68, 68, 0.02) 100%)',
                  borderColor: !isFree ? 'rgba(239, 68, 68, 0.15)' : 'var(--glass-border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                
                {/* Main Card Header */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        letterSpacing: '0.05em', 
                        textTransform: 'uppercase', 
                        background: category === 'Labs' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: category === 'Labs' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '0.35rem'
                      }}>
                        {category === 'Labs' ? 'Laboratory / Lab' : 'Lecture Classroom'}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {room}
                      </h3>
                    </div>
                    
                    {/* Status Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '30px',
                      padding: '0.25rem 0.75rem',
                      background: isFree ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: isFree ? 'var(--success)' : '#ef4444',
                      border: isFree ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                      boxShadow: isFree ? '0 0 10px rgba(16, 185, 129, 0.05)' : '0 0 10px rgba(239, 68, 68, 0.05)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isFree ? 'var(--success)' : '#ef4444'
                      }} />
                      {isFree ? 'FREE NOW' : 'OCCUPIED'}
                    </span>
                  </div>

                  {/* Occupancy Info */}
                  <div style={{ flex: 1 }}>
                    {isFree ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                          Room is currently empty and available for study, team sessions, or meetings.
                        </p>
                        
                        {nextClass ? (
                          <div style={{ 
                            background: 'var(--bg-secondary)', 
                            padding: '0.65rem 0.85rem', 
                            borderRadius: '8px', 
                            border: '1px dashed var(--glass-border)',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                          }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>
                              Next scheduled occupancy:
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              <Clock size={12} color="var(--accent-secondary)" /> {nextClass.startTime} - {nextClass.endTime}
                            </span>
                            <span style={{ display: 'block', marginTop: '0.1rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {nextClass.name} ({nextClass.teacher})
                            </span>
                          </div>
                        ) : (
                          <div style={{ 
                            background: 'rgba(16, 185, 129, 0.03)', 
                            padding: '0.65rem 0.85rem', 
                            borderRadius: '8px', 
                            border: '1px dashed rgba(16, 185, 129, 0.15)',
                            fontSize: '0.75rem',
                            color: 'var(--success)',
                            fontWeight: 600
                          }}>
                            ✓ No further lectures scheduled for today!
                          </div>
                        )}
                      </div>
                    ) : (
                      // Occupied Info
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.03)',
                          border: '1px solid rgba(239, 68, 68, 0.1)',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> ACTIVE LECTURE
                            </span>
                            <span>{activeClass.startTime} - {activeClass.endTime}</span>
                          </div>
                          
                          <h4 style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            color: 'var(--text-primary)', 
                            margin: '0 0 0.25rem 0',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }} title={activeClass.name}>
                            {activeClass.name}
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={10} color="var(--accent-primary)" /> Instructor: {activeClass.teacher}
                            </span>
                            <span>
                              🎓 Batch: {activeClass.batch || 'General'} • Sem {activeClass.semester} ({activeClass.type})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Drawer Action (Weekly/Daily Schedule) */}
                <div style={{ borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                  <button
                    onClick={() => setExpandedRoom(isExpanded ? null : room)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.5rem',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <BookOpen size={14} /> {todayClassesCount} classes today
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                      {isExpanded ? 'Hide Details' : 'View Schedule'}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {/* Expanded Schedule Drawer */}
                  {isExpanded && (
                    <div style={{ 
                      padding: '0 1.5rem 1.5rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--glass-border)',
                      paddingTop: '1rem',
                      background: 'var(--bg-secondary)',
                      animation: 'slideDown 0.25s ease-out'
                    }}>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0', fontWeight: 700 }}>
                        {selectedDay} Schedule ({room})
                      </h4>
                      {schedule.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '1.5rem 0', 
                          border: '1px dashed var(--glass-border)', 
                          borderRadius: '8px',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem' 
                        }}>
                          Empty Schedule • Entire Day Free
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {schedule.map((cls, idx) => {
                            const isCurrent = activeClass?.startTime === cls.startTime;
                            
                            return (
                              <div 
                                key={idx} 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  background: isCurrent ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
                                  border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                                }}
                              >
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: 700, 
                                  color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)',
                                  minWidth: '95px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {cls.startTime} - {cls.endTime}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600, 
                                    color: 'var(--text-primary)',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }} title={cls.name}>
                                    {cls.name}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {cls.teacher} • Sem {cls.semester}
                                  </div>
                                </div>
                                {isCurrent && (
                                  <span style={{
                                    fontSize: '0.55rem',
                                    fontWeight: 700,
                                    background: 'var(--accent-primary)',
                                    color: 'white',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px'
                                  }}>
                                    NOW
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Slide down animation utility style */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}
