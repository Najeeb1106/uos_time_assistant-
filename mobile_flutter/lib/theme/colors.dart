import 'package:flutter/material.dart';

class AppColors {
  // Static state synchronized by ThemeProvider
  static bool isDarkMode = true;

  // Base backgrounds matching web CSS variables
  static Color get bgPrimary => isDarkMode ? const Color(0xFF060814) : const Color(0xFFFFFFFF);
  static Color get bgSecondary => isDarkMode ? const Color(0xFF0B0F24) : const Color(0xFFFFFFFF);
  static Color get bgTertiary => isDarkMode ? const Color(0xFF131936) : const Color(0xFFF8FAFC);

  // Accents & Brand identity
  static Color get accentPrimary => isDarkMode ? const Color(0xFF6366F1) : const Color(0xFF4F46E5); // Indigo
  static Color get accentSecondary => isDarkMode ? const Color(0xFFA855F7) : const Color(0xFF9333EA); // Purple
  static Color get accentGlow => isDarkMode ? const Color(0x266366F1) : const Color(0x144F46E5); // rgba(99, 102, 241, 0.15)

  // Text colors
  static Color get textPrimary => isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A); // Slate 900
  static Color get textSecondary => isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569); // Slate 600
  static Color get textMuted => isDarkMode ? const Color(0xFF64748B) : const Color(0xFF64748B); // Slate 500

  // Status indicators
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);

  // Glassmorphic properties
  static Color get glassBg => isDarkMode ? const Color(0xB20D1229) : const Color(0xE6FFFFFF);
  static Color get glassBorder => isDarkMode ? const Color(0x15FFFFFF) : const Color(0xFFE2E8F0);
  static Color get glassShadow => isDarkMode ? const Color(0x59000000) : const Color(0x0A000000);

  // Gradients matching web aesthetics
  static RadialGradient get authBgGradient => RadialGradient(
    center: Alignment.center,
    radius: 1.0,
    colors: isDarkMode 
      ? [const Color(0xFF0E1330), const Color(0xFF060814)]
      : [const Color(0xFFEEF2F6), const Color(0xFFF8FAFC)],
  );

  static LinearGradient get primaryButtonGradient => const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF6366F1),
      Color(0xFFA855F7),
    ],
  );

  static LinearGradient get cardAccentGradient => LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: isDarkMode
      ? [const Color(0xFF1E1B4B), const Color(0xFF311042)]
      : [const Color(0xFFEEF2FF), const Color(0xFFF5F3FF)],
  );

  static LinearGradient get warningGradient => LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: isDarkMode
      ? [const Color(0xFFF59E0B), const Color(0xFFA855F7)]
      : [const Color(0xFFFEF3C7), const Color(0xFFF3E8FF)],
  );
}
