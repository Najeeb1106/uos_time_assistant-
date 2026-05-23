// Offline-First Zustand Store for UOS Timetable Mobile App
// Equipped with AsyncStorage persistence and robust offline synchronization

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevApiUrl = () => {
  try {
    // expo-constants reliably exposes the Metro bundler host in Expo Go
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0]; // strip the port (e.g. "192.168.1.3:8082" → "192.168.1.3")
      console.log('Autodetected Expo dev host IP:', host);
      return `http://${host}:3000/api`;
    }
  } catch (e) {
    console.log('Error reading Expo Constants for dev API endpoint:', e);
  }
  // Fallback: emulator loopback on Android, localhost on iOS
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};

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
      apiUrl: getDevApiUrl(),
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
          const cachedUser = get().user;
          if (cachedUser && cachedUser.email === email) {
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

          await get().fetchCurrentSchedule();
          return { success: true };
        } catch (error) {
          console.error('Login Error:', error);
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

      uploadPdf: async (fileUri, fileName, mimeType) => {
        const { apiUrl, token, isOnline } = get();
        if (!isOnline) {
          throw new Error('PDF upload requires an active internet connection.');
        }
        if (!token) {
          throw new Error('You must be logged in to upload a timetable.');
        }

        try {
          const formData = new FormData();
          formData.append('file', {
            uri: Platform.OS === 'android' ? decodeURIComponent(fileUri) : fileUri,
            name: fileName || 'timetable.pdf',
            type: mimeType || 'application/pdf'
          });

          // 1. Upload and parse the PDF file
          const res = await fetch(`${apiUrl}/schedule/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Do NOT set Content-Type — fetch sets multipart boundary automatically
            },
            body: formData
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);

          // 2. Immediately save the parsed classes to the user's account database
          const saveRes = await fetch(`${apiUrl}/schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              classes: data.classes || [],
              pdfFileName: fileName || 'timetable.pdf'
            })
          });
          const saveData = await saveRes.json();
          if (!saveData.success) throw new Error(saveData.message || 'Failed to save parsed timetable to database.');

          // 3. Update the local store state
          set({
            classes: data.classes || [],
            pdfFileName: fileName,
            uploadedAt: new Date().toISOString(),
            syncTimestamp: new Date().toISOString()
          });

          return { success: true, classCount: data.classes?.length || 0 };
        } catch (error) {
          console.error('PDF Upload Error:', error);
          throw error;
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
      partialize: (state) => {
        // Exclude apiUrl from persistence so it always resolves to the active platform code default
        const { apiUrl, ...rest } = state;
        return rest;
      },
      // Force apiUrl to always be freshly computed — never use a stale cached value
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        apiUrl: getDevApiUrl()
      })
    }
  )
);
