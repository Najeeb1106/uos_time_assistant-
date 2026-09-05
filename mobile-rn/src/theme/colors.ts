// Theme Colors for ShedUOS Mobile Application (Unified UOS Palette)

export const darkColors = {
  // Atmospheric Space Surfaces
  background: '#060814',          // Deep academic navy canvas
  surface: '#0B0F24',             // Primary card surface
  surfaceElevated: '#131936',     // Elevated chips & input tracks
  surfaceGlass: 'rgba(13, 18, 41, 0.75)',
  cardBackground: '#0B0F24',
  cardElevated: '#131936',

  // Accents & Brand Identity
  primary: '#6366F1',             // UOS Indigo/Navy
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryAccent: '#818CF8',
  secondary: '#8B5CF6',           // Controlled Purple Accent
  gold: '#F59E0B',                // UOS Gold
  goldLight: '#FCD34D',
  goldBg: 'rgba(245, 158, 11, 0.12)',
  goldBorder: 'rgba(245, 158, 11, 0.25)',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleBg: 'rgba(139, 92, 246, 0.12)',
  purpleBorder: 'rgba(139, 92, 246, 0.25)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.12)',
  infoBorder: 'rgba(59, 130, 246, 0.25)',
  glow: 'rgba(99, 102, 241, 0.15)',
  buttonGradientStart: '#1D4ED8', // Cobalt Royal Blue
  buttonGradientEnd: '#3B82F6',   // Sky Blue

  // Typography Tokens
  textPrimary: '#F8FAFC',         // High-contrast white
  textSecondary: '#94A3B8',       // Muted slate gray
  textMuted: '#64748B',           // Deep slate placeholder
  textDim: '#475569',
  textDisabled: '#64748B',

  // Refined Translucent Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#6366F1',
  borderHighlight: 'rgba(99, 102, 241, 0.4)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',

  // Semantic Status Feedback
  success: '#10B981',             // Emerald green
  successLight: 'rgba(16, 185, 129, 0.15)',
  successBg: 'rgba(16, 185, 129, 0.12)',
  successBorder: 'rgba(16, 185, 129, 0.25)',
  warning: '#F59E0B',             // Amber gold
  warningLight: 'rgba(245, 158, 11, 0.15)',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  warningBorder: 'rgba(245, 158, 11, 0.25)',
  error: '#EF4444',               // Ruby red
  errorLight: 'rgba(239, 68, 68, 0.15)',
  errorBg: 'rgba(239, 68, 68, 0.12)',
  errorBorder: 'rgba(239, 68, 68, 0.25)',
  danger: '#EF4444',

  // Feature specific
  ongoing: '#10B981',
  upcoming: '#6366F1',
  free: '#10B981',
  occupied: '#EF4444',
  offline: '#F59E0B',
  badgeBg: 'rgba(99, 102, 241, 0.12)',
  badgeBorder: 'rgba(99, 102, 241, 0.25)',
};

export const lightColors = {
  // Clean Web Light Surfaces
  background: '#F8FAFC',          // Crisp Light Canvas
  surface: '#FFFFFF',             // Pure White Card
  surfaceElevated: '#F1F5F9',     // Slate 100 Input Track & Chips
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',
  cardBackground: '#FFFFFF',
  cardElevated: '#F1F5F9',

  // Accents & Brand Identity
  primary: '#4F46E5',             // UOS Indigo/Navy
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  primaryAccent: '#4F46E5',
  secondary: '#7C3AED',           // Controlled Purple Accent
  gold: '#D97706',                // UOS Gold
  goldLight: '#B45309',
  goldBg: 'rgba(217, 119, 6, 0.1)',
  goldBorder: 'rgba(217, 119, 6, 0.25)',
  purple: '#7C3AED',
  purpleLight: '#6D28D9',
  purpleBg: 'rgba(124, 58, 237, 0.08)',
  purpleBorder: 'rgba(124, 58, 237, 0.2)',
  info: '#2563EB',
  infoBg: 'rgba(37, 99, 235, 0.08)',
  infoBorder: 'rgba(37, 99, 235, 0.2)',
  glow: 'rgba(79, 70, 229, 0.12)',
  buttonGradientStart: '#2563EB', // Blue
  buttonGradientEnd: '#3B82F6',   // Sky Blue

  // Typography Tokens
  textPrimary: '#111827',         // Deep slate black
  textSecondary: '#64748B',       // Slate gray
  textMuted: '#94A3B8',           // Muted gray
  textDim: '#CBD5E1',
  textDisabled: '#94A3B8',

  // Crisp Light Borders
  border: '#E2E8F0',
  borderFocus: '#4F46E5',
  borderHighlight: 'rgba(79, 70, 229, 0.4)',
  borderSubtle: '#F1F5F9',

  // Semantic Status Feedback
  success: '#059669',             // Emerald green
  successLight: 'rgba(5, 150, 105, 0.15)',
  successBg: 'rgba(5, 150, 105, 0.1)',
  successBorder: 'rgba(5, 150, 105, 0.25)',
  warning: '#D97706',             // Amber gold
  warningLight: 'rgba(217, 119, 6, 0.15)',
  warningBg: 'rgba(217, 119, 6, 0.1)',
  warningBorder: 'rgba(217, 119, 6, 0.25)',
  error: '#DC2626',               // Ruby red
  errorLight: 'rgba(220, 38, 38, 0.15)',
  errorBg: 'rgba(220, 38, 38, 0.1)',
  errorBorder: 'rgba(220, 38, 38, 0.25)',
  danger: '#DC2626',

  // Feature specific
  ongoing: '#059669',
  upcoming: '#4F46E5',
  free: '#059669',
  occupied: '#DC2626',
  offline: '#D97706',
  badgeBg: 'rgba(79, 70, 229, 0.08)',
  badgeBorder: 'rgba(79, 70, 229, 0.2)',
};

export type ThemeColors = typeof darkColors;
