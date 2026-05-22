import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Safe localStorage helper utilities
const safeParse = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
};

const safeGet = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
};

// Premium Mock Timetable Data for immediate visual excellence when not logged in
const mockClasses = [
  {
    classId: 'mock_1',
    name: 'Object Oriented Programming',
    code: 'CE1201',
    room: 'CR224',
    teacher: 'Dr. Muhammad Summair Raza',
    day: 'Monday',
    startTime: '08:30',
    endTime: '10:00',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_2',
    name: 'Software Engineering',
    code: 'SE1202',
    room: 'CR225',
    teacher: 'Dr. Anjum Tariq',
    day: 'Monday',
    startTime: '10:15',
    endTime: '11:45',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_3',
    name: 'Discrete Structures',
    code: 'MA1203',
    room: 'CR224',
    teacher: 'Dr. Sajid Ali',
    day: 'Tuesday',
    startTime: '08:30',
    endTime: '10:00',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_4',
    name: 'Software Engineering',
    code: 'SE1202',
    room: 'CR225',
    teacher: 'Dr. Anjum Tariq',
    day: 'Tuesday',
    startTime: '10:15',
    endTime: '11:45',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_5',
    name: 'Object Oriented Programming',
    code: 'CE1201',
    room: 'CR224',
    teacher: 'Dr. Muhammad Summair Raza',
    day: 'Wednesday',
    startTime: '08:30',
    endTime: '10:00',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_6',
    name: 'Communication Skills',
    code: 'HU1204',
    room: 'CR226',
    teacher: 'Ms. Hina Batool',
    day: 'Wednesday',
    startTime: '10:15',
    endTime: '11:45',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_7',
    name: 'Discrete Structures',
    code: 'MA1203',
    room: 'CR224',
    teacher: 'Dr. Sajid Ali',
    day: 'Thursday',
    startTime: '08:30',
    endTime: '10:00',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_8',
    name: 'Database Systems (Lab)',
    code: 'CE1205',
    room: 'Lab 3',
    teacher: 'Prof. Yasir Mahmood',
    day: 'Thursday',
    startTime: '12:00',
    endTime: '13:30',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_9',
    name: 'Communication Skills',
    code: 'HU1204',
    room: 'CR226',
    teacher: 'Ms. Hina Batool',
    day: 'Friday',
    startTime: '10:15',
    endTime: '11:45',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  },
  {
    classId: 'mock_10',
    name: 'Database Systems (Lab)',
    code: 'CE1205',
    room: 'Lab 3',
    teacher: 'Prof. Yasir Mahmood',
    day: 'Friday',
    startTime: '12:00',
    endTime: '13:30',
    batch: '2024-2028',
    semester: 2,
    type: 'Regular'
  }
];

export const useStore = create((set, get) => ({
  // Authentication State
  user: safeParse('uos_user', {
    email: 'student@uos.edu.pk',
    fullName: 'Ahmed Ali',
    role: 'student',
    program: 'BS in Software Engineering',
    type: 'Regular',
    batch: '2024-2028',
    semester: 2
  }),
  token: safeGet('uos_token', 'mock-jwt-session-token'),
  
  // Timetable State
  classes: safeParse('uos_classes', mockClasses),
  uploadedAt: safeGet('uos_uploaded_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()),
  pdfFileName: safeGet('uos_pdf_name', 'official_timetable_s2_2025.pdf'),
  uploadHistory: safeParse('uos_history', [
    {
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      pdfFileName: 'official_timetable_s2_2025.pdf',
      classCount: 10,
      status: 'success'
    }
  ]),

  // Active Parsed Timetable Parsing Session State (preserves state on sidebar navigation)
  parsedClasses: safeParse('uos_parsed_classes', []),
  parseStep: safeGet('uos_parse_step', 'idle'),
  parseProgress: Number(safeGet('uos_parse_progress', '0')),
  parseStatusText: safeGet('uos_parse_status_text', ''),
  parseFileName: safeGet('uos_parse_file_name', null),

  // UI Theme Settings
  themeMode: safeGet('uos_theme', 'dark'),
  isSidebarOpen: true,

  // Authentication Actions
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      set({
        token: data.token,
        user: data.user
      });
      localStorage.setItem('uos_token', data.token);
      localStorage.setItem('uos_user', JSON.stringify(data.user));

      // Fetch user's active schedule immediately
      await get().fetchCurrentSchedule();

      return { success: true };
    } catch (error) {
      console.error('Login action error:', error);
      throw error;
    }
  },
  
  register: async (email, profile) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...profile })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      set({
        token: data.token,
        user: data.user,
        classes: [],
        pdfFileName: null,
        uploadedAt: null,
        parsedClasses: [],
        parseStep: 'idle',
        parseProgress: 0,
        parseStatusText: '',
        parseFileName: null
      });
      localStorage.setItem('uos_token', data.token);
      localStorage.setItem('uos_user', JSON.stringify(data.user));
      localStorage.removeItem('uos_classes');
      localStorage.removeItem('uos_pdf_name');
      localStorage.removeItem('uos_uploaded_at');
      localStorage.removeItem('uos_parsed_classes');
      localStorage.removeItem('uos_parse_step');
      localStorage.removeItem('uos_parse_progress');
      localStorage.removeItem('uos_parse_status_text');
      localStorage.removeItem('uos_parse_file_name');

      return { success: true };
    } catch (error) {
      console.error('Register action error:', error);
      throw error;
    }
  },
  
  logout: () => {
    set({
      user: null,
      token: null,
      classes: [],
      uploadedAt: null,
      pdfFileName: null,
      parsedClasses: [],
      parseStep: 'idle',
      parseProgress: 0,
      parseStatusText: '',
      parseFileName: null
    });
    localStorage.removeItem('uos_token');
    localStorage.removeItem('uos_user');
    localStorage.removeItem('uos_classes');
    localStorage.removeItem('uos_pdf_name');
    localStorage.removeItem('uos_uploaded_at');
    localStorage.removeItem('uos_parsed_classes');
    localStorage.removeItem('uos_parse_step');
    localStorage.removeItem('uos_parse_progress');
    localStorage.removeItem('uos_parse_status_text');
    localStorage.removeItem('uos_parse_file_name');
  },

  updateProfile: async (profileData) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      set({ user: data.user });
      localStorage.setItem('uos_user', JSON.stringify(data.user));

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Update Profile action error:', error);
      throw error;
    }
  },

  // Timetable Actions
  fetchCurrentSchedule: async () => {
    const { token } = get();
    if (!token || token === 'mock-jwt-session-token') return;
    try {
      const res = await fetch(`${API_URL}/schedule/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        set({
          classes: data.classes || [],
          pdfFileName: data.pdfFileName || null,
          uploadedAt: data.uploadedAt || null
        });
        if (data.classes && data.classes.length > 0) {
          localStorage.setItem('uos_classes', JSON.stringify(data.classes));
          localStorage.setItem('uos_pdf_name', data.pdfFileName || '');
          localStorage.setItem('uos_uploaded_at', data.uploadedAt || '');
        } else {
          localStorage.removeItem('uos_classes');
          localStorage.removeItem('uos_pdf_name');
          localStorage.removeItem('uos_uploaded_at');
        }
      }
    } catch (error) {
      console.error('Fetch schedule error:', error);
    }
  },

  parseTimetableFile: async (file) => {
    const { token } = get();
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/schedule/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      return {
        classes: data.classes,
        pdfFileName: data.pdfFileName
      };
    } catch (error) {
      console.error('Parse Timetable File action error:', error);
      throw error;
    }
  },

  uploadSchedule: async (pdfFileName, parsedClasses) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_URL}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classes: parsedClasses, pdfFileName })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const uploadedAt = new Date().toISOString();
      set((state) => {
        const newHistoryItem = {
          uploadedAt,
          pdfFileName,
          classCount: parsedClasses.length,
          status: 'success'
        };
        const updatedHistory = [newHistoryItem, ...state.uploadHistory];
        localStorage.setItem('uos_history', JSON.stringify(updatedHistory));
        return {
          pdfFileName,
          classes: parsedClasses,
          uploadedAt,
          uploadHistory: updatedHistory
        };
      });

      localStorage.setItem('uos_classes', JSON.stringify(parsedClasses));
      localStorage.setItem('uos_pdf_name', pdfFileName);
      localStorage.setItem('uos_uploaded_at', uploadedAt);
      
      // Clear temporary parsed preview workspace state since it has been confirmed & saved!
      get().clearParsedState();
      
      return { success: true };
    } catch (error) {
      console.error('Save Schedule Error:', error);
      throw error;
    }
  },

  deleteSchedule: async () => {
    const { token } = get();
    set({
      classes: [],
      uploadedAt: null,
      pdfFileName: null
    });
    localStorage.removeItem('uos_classes');
    localStorage.removeItem('uos_pdf_name');
    localStorage.removeItem('uos_uploaded_at');

    if (token && token !== 'mock-jwt-session-token') {
      try {
        await fetch(`${API_URL}/schedule`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Delete Schedule server error:', err);
      }
    }
  },

  // Inline Class Editor (Saves time if PDF parser misses slightly)
  updateClass: async (classId, updatedClass) => {
    const { classes, token } = get();
    const updatedClasses = classes.map((cls) => cls.classId === classId ? { ...cls, ...updatedClass } : cls);
    set({ classes: updatedClasses });
    localStorage.setItem('uos_classes', JSON.stringify(updatedClasses));

    if (token && token !== 'mock-jwt-session-token') {
      try {
        await fetch(`${API_URL}/schedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ classes: updatedClasses })
        });
      } catch (err) {
        console.error('Update Class server error:', err);
      }
    }
  },

  addClass: async (newClass) => {
    const { classes, token } = get();
    const newClassWithId = { classId: 'cls_' + Date.now(), ...newClass };
    const updatedClasses = [...classes, newClassWithId];
    set({ classes: updatedClasses });
    localStorage.setItem('uos_classes', JSON.stringify(updatedClasses));

    if (token && token !== 'mock-jwt-session-token') {
      try {
        await fetch(`${API_URL}/schedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ classes: updatedClasses })
        });
      } catch (err) {
        console.error('Add Class server error:', err);
      }
    }
  },

  deleteClass: async (classId) => {
    const { classes, token } = get();
    const updatedClasses = classes.filter((cls) => cls.classId !== classId);
    set({ classes: updatedClasses });
    localStorage.setItem('uos_classes', JSON.stringify(updatedClasses));

    if (token && token !== 'mock-jwt-session-token') {
      try {
        await fetch(`${API_URL}/schedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ classes: updatedClasses })
        });
      } catch (err) {
        console.error('Delete Class server error:', err);
      }
    }
  },

  // Active Parsed Timetable Parsing Session Actions
  setParsedClasses: (parsedClasses) => {
    set({ parsedClasses });
    localStorage.setItem('uos_parsed_classes', JSON.stringify(parsedClasses));
  },

  setParseStep: (parseStep) => {
    set({ parseStep });
    localStorage.setItem('uos_parse_step', parseStep);
  },

  setParseProgress: (parseProgress) => {
    set({ parseProgress });
    localStorage.setItem('uos_parse_progress', String(parseProgress));
  },

  setParseStatusText: (parseStatusText) => {
    set({ parseStatusText });
    localStorage.setItem('uos_parse_status_text', parseStatusText);
  },

  setParseFileName: (parseFileName) => {
    set({ parseFileName });
    if (parseFileName) {
      localStorage.setItem('uos_parse_file_name', parseFileName);
    } else {
      localStorage.removeItem('uos_parse_file_name');
    }
  },

  clearParsedState: () => {
    set({
      parsedClasses: [],
      parseStep: 'idle',
      parseProgress: 0,
      parseStatusText: '',
      parseFileName: null
    });
    localStorage.removeItem('uos_parsed_classes');
    localStorage.removeItem('uos_parse_step');
    localStorage.removeItem('uos_parse_progress');
    localStorage.removeItem('uos_parse_status_text');
    localStorage.removeItem('uos_parse_file_name');
  },

  // Toggle UI Theme
  toggleTheme: () => set((state) => {
    const nextTheme = state.themeMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('uos_theme', nextTheme);
    return { themeMode: nextTheme };
  }),

  toggleSidebar: () => set((state) => ({
    isSidebarOpen: !state.isSidebarOpen
  }))
}));
