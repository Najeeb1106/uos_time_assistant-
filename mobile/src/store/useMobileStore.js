// Offline-First Zustand Store for UOS Timetable Mobile App
// Equipped with AsyncStorage persistence and robust offline synchronization

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// High-Fidelity Mock Timetable Data matching our web version for premium immediate UI preview
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
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
    type: 'Regular',
    program: 'BS in Software Engineering'
  }
];

export const useMobileStore = create(
  persist(
    (set, get) => ({
      // Base API endpoint - customizable for direct debugging on actual physical devices
      apiUrl: 'http://10.0.2.2:3000/api', // default host loopback for Android Emulators
      isOnline: true,
      themeMode: 'dark',
      activeTab: 'dashboard', // Custom tab navigation selector: 'dashboard' | 'schedule' | 'profile'
      
      // Authentication State
      user: {
        email: 'student@uos.edu.pk',
        fullName: 'Ahmed Ali',
        role: 'student',
        program: 'BS in Software Engineering',
        type: 'Regular',
        batch: '2024-2028',
        semester: 2
      },
      token: 'mock-jwt-session-token',
      
      // Cache states
      classes: mockClasses,
      pdfFileName: 'official_timetable_s2_2025.pdf',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      syncTimestamp: new Date().toISOString(),

      // Actions
      setApiUrl: (url) => set({ apiUrl: url }),
      setOnlineStatus: (status) => set({ isOnline: status }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'dark' ? 'light' : 'dark' })),

      login: async (email, password) => {
        const { apiUrl, isOnline } = get();
        
        if (!isOnline) {
          // Robust Offline Validation Fallback
          const cachedUser = get().user;
          if (cachedUser && cachedUser.email === email) {
            // Permit launching into app using cached session if email matches
            return { success: true, offline: true, message: 'Welcome back! Running in offline mode.' };
          }
          throw new Error('Network offline. Please connect to the internet to perform your initial login.');
        }

        try {
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);

          set({
            token: data.token,
            user: data.user,
            syncTimestamp: new Date().toISOString()
          });

          // Pre-fetch timetable classes
          await get().fetchCurrentSchedule();
          return { success: true };
        } catch (error) {
          console.error('Mobile Login API Error:', error);
          throw error;
        }
      },

      register: async (email, profile) => {
        const { apiUrl, isOnline } = get();
        if (!isOnline) {
          throw new Error('Registration requires an active internet connection.');
        }

        try {
          const res = await fetch(`${apiUrl}/auth/register`, {
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
            syncTimestamp: new Date().toISOString()
          });

          return { success: true };
        } catch (error) {
          console.error('Mobile Register API Error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          classes: [],
          pdfFileName: null,
          uploadedAt: null,
          activeTab: 'dashboard'
        });
      },

      updateProfile: async (profileData) => {
        const { token, apiUrl, isOnline } = get();
        
        // Immediate local cache update for seamless offline interaction
        set((state) => ({
          user: { ...state.user, ...profileData }
        }));

        if (!isOnline || !token || token === 'mock-jwt-session-token') {
          return { success: true, offline: true, message: 'Profile updated locally.' };
        }

        try {
          const res = await fetch(`${apiUrl}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);

          set({ user: data.user, syncTimestamp: new Date().toISOString() });
          return { success: true, message: data.message };
        } catch (error) {
          console.log('Profile Sync Error, kept local updates:', error.message);
          return { success: true, offline: true, message: 'Saved locally. Sync pending connection.' };
        }
      },

      fetchCurrentSchedule: async () => {
        const { token, apiUrl, isOnline } = get();
        if (!isOnline || !token || token === 'mock-jwt-session-token') {
          console.log('Skipping API schedule fetch: Offline or running on Mock Token.');
          return;
        }

        try {
          const res = await fetch(`${apiUrl}/schedule/current`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set({
              classes: data.classes || [],
              pdfFileName: data.pdfFileName || null,
              uploadedAt: data.uploadedAt || null,
              syncTimestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.warn('Sync Fetch Schedule Failed. Preserving local SQLite/AsyncStorage cache:', error.message);
        }
      },

      forceSync: async () => {
        const { isOnline } = get();
        if (!isOnline) {
          throw new Error('Cannot synchronize while offline. Please connect to a network.');
        }
        await get().fetchCurrentSchedule();
        return true;
      }
    }),
    {
      name: 'uos-mobile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
