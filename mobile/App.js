// UOS Timetable Mobile App - Root Entry File
// Equipped with beautiful glassmorphism, dynamic status bar, offline banner, and custom tab navigation.

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useMobileStore } from './src/store/useMobileStore';
import { COLORS, COMMON_STYLES } from './src/components/Theme';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import WeeklyScheduleScreen from './src/screens/WeeklyScheduleScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const { width } = Dimensions.get('window');

export default function App() {
  const isOnline = useMobileStore((state) => state.isOnline);
  const setOnlineStatus = useMobileStore((state) => state.setOnlineStatus);
  const theme = useMobileStore((state) => state.themeMode);
  const user = useMobileStore((state) => state.user);
  const token = useMobileStore((state) => state.token);
  const activeTab = useMobileStore((state) => state.activeTab);
  const setActiveTab = useMobileStore((state) => state.setActiveTab);

  const [isRegistering, setIsRegistering] = useState(false);

  // Active theme properties
  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  // Highly robust internet connectivity checker (polls every 8 seconds)
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        
        // Fetch to a ultra-fast network address to determine actual connection
        await fetch('https://www.google.com', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        if (!isOnline) setOnlineStatus(true);
      } catch (error) {
        if (isOnline) setOnlineStatus(false);
      }
    };

    checkConnection();
    const timer = setInterval(checkConnection, 8000);
    return () => clearInterval(timer);
  }, [isOnline]);

  // Handle routing between screens
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'schedule':
        return <WeeklyScheduleScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  // If user is not authenticated, render Login/Register flow
  if (!token || !user) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} translucent />
        {isRegistering ? (
          <RegisterScreen onToggleAuth={() => setIsRegistering(false)} />
        ) : (
          <LoginScreen onToggleAuth={() => setIsRegistering(true)} />
        )}
      </View>
    );
  }

  // Active theme main dashboard
  return (
    <View style={[s.container, { backgroundColor: c.bgPrimary, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0 }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} translucent />
      
      {/* Dynamic Offline Toast Indicator at top */}
      {!isOnline && (
        <View style={[styles.offlineToast, { backgroundColor: c.danger }]}>
          <Ionicons name="cloud-offline" size={14} color="#ffffff" />
          <Text style={styles.offlineToastText}>
            Offline Mode: timetable queries running from cached storage
          </Text>
        </View>
      )}

      {/* Main Active Screen container */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Glassmorphic floating navigation bottom bar */}
      <View style={[styles.tabBarContainer, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
            size={22}
            color={activeTab === 'dashboard' ? (user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary) : c.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'dashboard' ? (user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary) : c.textSecondary }
          ]}>
            Dashboard
          </Text>
          {activeTab === 'dashboard' && (
            <View style={[
              styles.activeDot,
              { backgroundColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }
            ]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('schedule')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'schedule' ? 'calendar' : 'calendar-outline'}
            size={22}
            color={activeTab === 'schedule' ? (user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary) : c.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'schedule' ? (user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary) : c.textSecondary }
          ]}>
            Weekly Grid
          </Text>
          {activeTab === 'schedule' && (
            <View style={[
              styles.activeDot,
              { backgroundColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }
            ]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'profile' ? (user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary) : c.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'profile' ? (user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary) : c.textSecondary }
          ]}>
            Settings
          </Text>
          {activeTab === 'profile' && (
            <View style={[
              styles.activeDot,
              { backgroundColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }
            ]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  offlineToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
  },
  offlineToastText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    textAlign: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  }
});
