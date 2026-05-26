import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  AlertCircle, 
  HelpCircle,
  Clock,
  MapPin,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { parseTimetablePdf } from '../utils/pdfParser';

export default function UploadPage() {
  const { 
    uploadSchedule, 
    parseTimetableFile, 
    user,
    parsedClasses,
    parseStep,
    parseProgress,
    parseStatusText,
    parseFileName,
    setParsedClasses,
    setParseStep,
    setParseProgress,
    setParseStatusText,
    setParseFileName,
    clearParsedState,
    uploadHistory
  } = useStore();
  const navigate = useNavigate();
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isScannedFallback, setIsScannedFallback] = useState(false);
  const [scannedMessage, setScannedMessage] = useState('');

  const fileInputRef = useRef(null);

  // Sample data simulating a successful PDF parse result for the user's batch/semester
  const getMockParsedData = (fileName) => {
    return [
      {
        classId: 'p_' + Math.random().toString(36).substring(2),
        name: 'Object Oriented Programming',
        code: 'CE1201',
        room: 'CR224',
        teacher: 'Dr. Muhammad Summair Raza',
        day: 'Monday',
        startTime: '08:30',
        endTime: '10:00',
        batch: user?.batch || '2024-2028',
        semester: user?.semester || 2,
        type: user?.type || 'Regular'
      },
      {
        classId: 'p_' + Math.random().toString(36).substring(2),
        name: 'Software Engineering',
        code: 'SE1202',
        room: 'CR225',
        teacher: 'Dr. Anjum Tariq',
        day: 'Monday',
        startTime: '10:15',
        endTime: '11:45',
        batch: user?.batch || '2024-2028',
        semester: user?.semester || 2,
        type: user?.type || 'Regular'
      },
      {
        classId: 'p_' + Math.random().toString(36).substring(2),
        name: 'Discrete Structures',
        code: 'MA1203',
        room: 'CR224',
        teacher: 'Dr. Sajid Ali',
        day: 'Tuesday',
        startTime: '08:30',
        endTime: '10:00',
        batch: user?.batch || '2024-2028',
        semester: user?.semester || 2,
        type: user?.type || 'Regular'
      },
      {
        classId: 'p_' + Math.random().toString(36).substring(2),
        name: 'Database Systems (Lab)',
        code: 'CE1205',
        room: 'Lab 3',
        teacher: 'Prof. Yasir Mahmood',
        day: 'Thursday',
        startTime: '12:00',
        endTime: '13:30',
        batch: user?.batch || '2024-2028',
        semester: user?.semester || 2,
        type: user?.type || 'Regular'
      }
    ];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFile = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setErrorMessage('Unsupported file format. Please upload an official timetable in PDF format.');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit. Please upload a smaller compressed PDF.');
      return;
    }

    setFile(selectedFile);
    setParseFileName(selectedFile.name);
    startParsingPipeline(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  // High-fidelity parser step-by-step real execution
  const startParsingPipeline = async (targetFile) => {
    setParseStep('parsing');
    setParseProgress(10);
    setParseStatusText('Uploading PDF to secure server...');
    setIsScannedFallback(false);
    setScannedMessage('');

    try {
      setParseProgress(40);
      setParseStatusText('Analyzing timetable coordinates server-side...');
      
      const result = await parseTimetableFile(targetFile);
      
      setParseProgress(80);
      setParseStatusText('Filtering schedule for your student profile...');

      const classes = result.classes || [];
      const userSemester = Number(user?.semester) || 2;
      
      setParseProgress(100);
      setParseStatusText('Successfully parsed timetable!');

      if (result.isScannedFallback) {
        setIsScannedFallback(true);
        setScannedMessage(result.message || '');
      }

      if (classes.length === 0) {
        setErrorMessage(`No matching classes found in PDF for Semester ${userSemester} [${user?.type}]. You can manually add classes or re-check profile.`);
        setParsedClasses([]);
      } else {
        // Map classId if missing (backend gives standard structure)
        const formattedClasses = classes.map(cls => ({
          classId: cls.classId || 'p_' + Math.random().toString(36).substring(2),
          ...cls
        }));
        setParsedClasses(formattedClasses);
      }
      
      setParseStep('preview');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while parsing the timetable PDF.');
      setParseStep('idle');
    }
  };

  // Start edit class
  const handleEditClick = (cls) => {
    setEditingClassId(cls.classId);
    setEditFormData({ ...cls });
  };

  // Save edit class
  const handleSaveEdit = (classId) => {
    setParsedClasses(
      parsedClasses.map((c) => (c.classId === classId ? { ...editFormData } : c))
    );
    setEditingClassId(null);
  };

  // Handle edit fields changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  // Delete class
  const handleDeleteClass = (classId) => {
    if (window.confirm('Delete this parsed lecture from this schedule?')) {
      setParsedClasses(parsedClasses.filter((c) => c.classId !== classId));
    }
  };

  // Add empty class
  const handleAddClass = () => {
    const newCls = {
      classId: 'p_' + Math.random().toString(36).substring(2),
      name: 'New Course Lecture',
      code: 'CS1000',
      room: 'CR000',
      teacher: 'Assign Lecturer',
      day: 'Monday',
      startTime: '08:30',
      endTime: '10:00',
      batch: user.batch,
      semester: user.semester,
      type: user.type
    };
    setParsedClasses([...parsedClasses, newCls]);
    handleEditClick(newCls);
  };

  // Save changes to global store
  const handleConfirmTimetable = async () => {
    if (parsedClasses.length === 0) {
      setErrorMessage('Your timetable must contain at least one class before saving.');
      return;
    }
    
    try {
      setParseStep('parsing');
      setParseProgress(90);
      setParseStatusText('Saving schedule to your account...');
      
      await uploadSchedule(parseFileName || (file ? file.name : 'manual_timetable.pdf'), parsedClasses);
      
      setParseProgress(100);
      setParseStatusText('Saved successfully!');
      
      // Short delay for high-fidelity premium feel
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save timetable to your account. Please try again.');
      setParseStep('preview');
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      <div>
        <h1 style={{ marginBottom: '0.25rem' }}>Parse Timetable PDF</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Drag-and-drop the department PDF. Our parser will isolate classes for <strong>{user?.program} (Sem {user?.semester})</strong>.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          padding: '1rem',
          borderRadius: '12px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <div>{errorMessage}</div>
        </div>
      )}

      {parseStep === 'idle' && (
        /* Dropzone view */
        <div 
          className="glass-panel"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 2rem',
            border: isDragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--glass-border)',
            background: isDragActive ? 'rgba(99, 102, 241, 0.06)' : 'var(--glass-bg)',
            cursor: 'pointer',
            textAlign: 'center',
            gap: '1.5rem',
            transition: 'var(--transition-normal)'
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            style={{ display: 'none' }}
          />

          <div style={{
            background: isDragActive ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
            color: isDragActive ? '#ffffff' : 'var(--accent-primary)',
            padding: '1.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDragActive ? '0 0 25px rgba(99, 102, 241, 0.4)' : 'none',
            transition: 'var(--transition-normal)'
          }}>
            <Upload size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Drag and drop your official PDF here
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Supports official Department Timetable files up to 25MB
            </p>
          </div>

          <button className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
            Choose File From Device
          </button>
        </div>
      )}

      {parseStep === 'idle' && uploadHistory && uploadHistory.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <FileText size={18} color="var(--accent-primary)" /> Upload & Parsing History
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {uploadHistory.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--success)',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '250px' }} title={item.pdfFileName}>
                      {item.pdfFileName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Successfully parsed {item.classCount} classes
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>
                    🕒 {new Date(item.uploadedAt).toLocaleString()}
                  </span>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    textTransform: 'uppercase'
                  }}>
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {parseStep === 'parsing' && (
        /* Progress loader view */
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', gap: '2rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid var(--bg-tertiary)',
              borderTopColor: 'var(--accent-primary)',
              animation: 'spin 1s linear infinite'
            }}></div>
            <FileText size={24} color="var(--accent-primary)" style={{ position: 'absolute' }} />
          </div>
          
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {parseProgress}% Parsed
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', height: '20px' }}>
              {parseStatusText}
            </p>
            
            {/* Custom progress bar */}
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${parseProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {parseStep === 'preview' && (
        /* Editable workspace view */
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Workspace Controls Header */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
                Parser Workspace
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Found {parsedClasses.length} Lectures  matching {user?.program || 'your program'} (Sem {user?.semester})
              </h3>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={handleAddClass}
                className="btn btn-secondary" 
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <Plus size={16} /> Add Class
              </button>
              <button 
                onClick={handleConfirmTimetable}
                className="btn btn-primary" 
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
              >
                <Check size={16} /> Confirm & Save
              </button>
            </div>
          </div>
          {!isScannedFallback && (
            <div className="glass-panel animate-fade-in" style={{
              padding: '1.25rem 1.5rem',
              borderLeft: '4px solid var(--success)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--glass-bg) 100%)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.05)'
            }}>
              <Check size={20} color="var(--success)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)' }}>Timetable Parsed Successfully!</h4>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  We have cleanly extracted <strong>{parsedClasses.length} lectures</strong> matching your academic coordinates. Please review them below before saving.
                </p>
              </div>
            </div>
          )}
          {isScannedFallback && (
            <div className="glass-panel animate-fade-in" style={{
              padding: '1.25rem 1.5rem',
              borderLeft: '4px solid var(--warning)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--glass-bg) 100%)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.08)'
            }}>
              <AlertCircle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Scanned PDF Timetable Preloaded</h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {scannedMessage || "Notice: The PDF is formatted as a scanned graphic (no extractable text). To save you time, we pre-loaded your program's authentic schedule, which you can easily customize manually below!"}
                </p>
              </div>
            </div>
          )}

          {/* List of Parsed Classes Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...parsedClasses]
              .sort((a, b) => {
                const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
                const dayDiff = (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9);
                if (dayDiff !== 0) return dayDiff;
                return (a.startTime || '').localeCompare(b.startTime || '');
              })
              .map((cls) => {
              const isEditing = editingClassId === cls.classId;
              
              if (isEditing) {
                return (
                  <div key={cls.classId} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-secondary)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Course Name</label>
                        <input 
                          type="text" 
                          name="name" 
                          className="input-field" 
                          value={editFormData.name} 
                          onChange={handleEditChange} 
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Code</label>
                        <input 
                          type="text" 
                          name="code" 
                          className="input-field" 
                          value={editFormData.code} 
                          onChange={handleEditChange} 
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Room</label>
                        <input 
                          type="text" 
                          name="room" 
                          className="input-field" 
                          value={editFormData.room} 
                          onChange={handleEditChange} 
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Teacher</label>
                        <input 
                          type="text" 
                          name="teacher" 
                          className="input-field" 
                          value={editFormData.teacher} 
                          onChange={handleEditChange} 
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Day</label>
                        <select 
                          name="day" 
                          className="input-field select-field" 
                          value={editFormData.day} 
                          onChange={handleEditChange}
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Start Time</label>
                        <input 
                          type="text" 
                          name="startTime" 
                          className="input-field" 
                          placeholder="e.g. 08:30" 
                          value={editFormData.startTime} 
                          onChange={handleEditChange} 
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">End Time</label>
                        <input 
                          type="text" 
                          name="endTime" 
                          className="input-field" 
                          placeholder="e.g. 10:00" 
                          value={editFormData.endTime} 
                          onChange={handleEditChange} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                      <button 
                        onClick={() => setEditingClassId(null)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveEdit(cls.classId)}
                        className="btn btn-primary" 
                        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                      >
                        <Check size={14} /> Keep Edit
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={cls.classId} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {cls.code}
                      </span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{cls.name}</strong>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} color="var(--accent-primary)" /> {cls.day} {cls.startTime} - {cls.endTime}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} color="var(--accent-secondary)" /> Room {cls.room}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <UserIcon size={12} color="var(--text-muted)" /> {cls.teacher}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button 
                      onClick={() => handleEditClick(cls)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                      title="Edit parsed parameters"
                    >
                      <Edit3 size={14} />
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteClass(cls.classId)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      title="Remove class"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              onClick={() => clearParsedState()}
              className="btn btn-secondary" 
              style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={14} /> Re-upload PDF
            </button>
          </div>

        </div>
      )}
      
      {/* Visual instructions key */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
