// High-Fidelity Glassmorphic Login Screen for UOS Timetable
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMobileStore } from '../store/useMobileStore';
import { COLORS, COMMON_STYLES } from '../components/Theme';

export default function LoginScreen({ onToggleAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  // Focus status variables
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const login = useMobileStore((state) => state.login);
  const isOnline = useMobileStore((state) => state.isOnline);
  const theme = useMobileStore((state) => state.themeMode);
  
  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Incomplete Fields', 'Please enter both your email address and password.');
      return;
    }

    if (role === 'teacher' && !email.toLowerCase().endsWith('@uos.edu.pk')) {
      Alert.alert('Domain Restriction', 'Teachers are strictly required to log in using an official university email (@uos.edu.pk).');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.offline) {
        Alert.alert('Offline Mode Active', res.message);
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Check your credentials and server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[c.gradientStart, c.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo & Header */}
          <View style={styles.logoSection}>
            <View style={[styles.logoOutline, { borderColor: c.accentPrimary }]}>
              <Ionicons name="calendar" size={48} color={c.accentPrimary} />
            </View>
            <Text style={[s.title, styles.titleText]}>UOS Timetable</Text>
            <Text style={[s.mutedText, styles.subtitleText]}>
              University of Sargodha Schedule Portal
            </Text>
          </View>

          {/* Role Segment Toggle */}
          <View style={[styles.roleContainer, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'student' && [styles.activeTab, { backgroundColor: c.accentPrimary }]
              ]}
              onPress={() => setRole('student')}
            >
              <Ionicons
                name="school"
                size={18}
                color={role === 'student' ? '#ffffff' : c.textSecondary}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.roleText,
                { color: role === 'student' ? '#ffffff' : c.textSecondary }
              ]}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'teacher' && [styles.activeTab, { backgroundColor: c.accentSecondary }]
              ]}
              onPress={() => setRole('teacher')}
            >
              <Ionicons
                name="briefcase"
                size={18}
                color={role === 'teacher' ? '#ffffff' : c.textSecondary}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.roleText,
                { color: role === 'teacher' ? '#ffffff' : c.textSecondary }
              ]}>Teacher</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={s.glassCard}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>UOS Email Address</Text>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                emailFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="mail" size={20} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput]}
                  placeholder={role === 'teacher' ? 'name@uos.edu.pk' : 'student@uos.edu.pk'}
                  placeholderTextColor={c.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Password</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                passwordFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="lock-closed" size={20} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput]}
                  placeholder="••••••••"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons
                    name={secureText ? 'eye-off' : 'eye'}
                    size={20}
                    color={c.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Offline Alert Indicator */}
            {!isOnline && (
              <View style={[styles.offlineBanner, { backgroundColor: c.warning + '1A', borderColor: c.warning }]}>
                <Ionicons name="cloud-offline" size={16} color={c.warning} />
                <Text style={[s.mutedText, { color: c.warning, marginLeft: 8 }]}>
                  Offline Mode: Cached sessions only
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                s.btn, 
                s.btnPrimary,
                { backgroundColor: role === 'student' ? c.accentPrimary : c.accentSecondary, marginTop: 10 }
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={s.btnTextPrimary}>LOG IN</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Screen Switcher */}
          <TouchableOpacity onPress={onToggleAuth} style={styles.registerToggle}>
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>
              Don't have an account?{' '}
              <Text style={{ color: role === 'student' ? c.accentPrimary : c.accentSecondary, fontWeight: '700' }}>
                Register Here
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  titleText: {
    marginBottom: 4,
    fontSize: 28,
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 13,
  },
  roleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  registerToggle: {
    marginTop: 16,
  }
});
