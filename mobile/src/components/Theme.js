// Premium Harmonious Color System & Core Style Tokens for UOS Timetable Mobile App
// Completely synchronized with web assets (Outfit font defaults, sleek dark modes, glassmorphism)

import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Deep space-gray & indigo backdrops
  dark: {
    bgPrimary: '#060814',
    bgSecondary: '#0b0f24',
    bgTertiary: '#131936',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentPrimary: '#6366f1', // Indigo
    accentSecondary: '#a855f7', // Purple
    accentGlow: 'rgba(99, 102, 241, 0.15)',
    glassBg: 'rgba(13, 18, 41, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassShadow: 'rgba(0, 0, 0, 0.35)',
    inputBg: 'rgba(6, 8, 20, 0.6)',
    inputFocusBg: 'rgba(6, 8, 20, 0.85)',
    gradientStart: '#0e1330',
    gradientEnd: '#060814',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  light: {
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accentPrimary: '#4f46e5', // Rich Indigo
    accentSecondary: '#9333ea', // Rich Purple
    accentGlow: 'rgba(79, 70, 229, 0.08)',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(15, 23, 42, 0.08)',
    glassShadow: 'rgba(15, 23, 42, 0.04)',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    inputFocusBg: '#ffffff',
    gradientStart: '#f1f5f9',
    gradientEnd: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  }
};

export const COMMON_STYLES = (theme = 'dark') => {
  const c = COLORS[theme];
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bgPrimary,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 110,
    },
    // Glassmorphism Card
    glassCard: {
      width: '100%',
      alignSelf: 'stretch',
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: c.glassShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 5,
    },
    // Input Fields
    inputGroup: {
      marginBottom: 16,
      width: '100%',
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 8,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    inputField: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: 8,
      color: c.textPrimary,
      fontSize: 15,
    },
    inputFieldFocus: {
      borderColor: c.accentPrimary,
      backgroundColor: c.inputFocusBg,
    },
    // Button styling with custom layout
    btn: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginVertical: 8,
    },
    btnPrimary: {
      backgroundColor: c.accentPrimary,
      shadowColor: c.accentPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 3,
    },
    btnTextPrimary: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    btnSecondary: {
      backgroundColor: c.bgTertiary,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    btnTextSecondary: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: c.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: c.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    // Typography standardizations
    bodyText: {
      color: c.textPrimary,
      fontSize: 15,
    },
    mutedText: {
      color: c.textMuted,
      fontSize: 13,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    }
  });
};
