// High-Fidelity Glassmorphic Register Screen for UOS Timetable
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

export default function RegisterScreen({ onToggleAuth }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // 'student' | 'teacher'

  // Student Cohort Parameters
  const [program, setProgram] = useState('BS in Software Engineering');
  const [type, setType] = useState('Regular');
  const [batch, setBatch] = useState('2024-2028');
  const [semester, setSemester] = useState('2');

  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  // Focus status variables
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [batchFocused, setBatchFocused] = useState(false);

  const register = useMobileStore((state) => state.register);
  const theme = useMobileStore((state) => state.themeMode);
  
  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  // Program Options Picker List
  const programs = [
    'BS in Software Engineering',
    'BS in Computer Science',
    'BS in Information Technology',
    'BS in Data Science',
    'BS in Artificial Intelligence',
    'MS in Computer Science'
  ];

  const types = ['Regular', 'Self Support', 'Weekend Self Support'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const handleRegister = async () => {
    if (!email || !fullName || !password) {
      Alert.alert('Required Fields', 'Please fill in all core fields (Full Name, Email, Password).');
      return;
    }

    if (!email.toLowerCase().endsWith('@uos.edu.pk')) {
      Alert.alert('Email Validation', 'Please use your official university email (e.g., username@uos.edu.pk).');
      return;
    }

    if (role === 'student' && !/^\d{4}-\d{4}$/.test(batch)) {
      Alert.alert('Invalid Batch Format', 'Session / Batch must be formatted as YYYY-YYYY (e.g., 2024-2028).');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Criteria', 'For standard account security, your password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName,
        password,
        role
      };

      if (role === 'student') {
        payload.program = program;
        payload.type = type;
        payload.batch = batch;
        payload.semester = Number(semester);
      }

      await register(email, payload);
      Alert.alert('Success', 'Profile registered successfully!');
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'An account with this email might already exist.');
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoOutline, { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }]}>
              <Ionicons name="school" size={32} color={role === 'student' ? c.accentPrimary : c.accentSecondary} />
            </View>
            <Text style={[s.title, styles.titleText]}>
              {role === 'student' ? 'Create Student Profile' : 'Create Teacher Profile'}
            </Text>
            <Text style={[s.mutedText, styles.subtitleText]}>
              {role === 'student' 
                ? 'Align your timetable to your batch coordinates' 
                : 'Enter details to view your filtered classes'}
            </Text>
          </View>

          {/* Role selector segmented control */}
          <View style={[styles.roleContainer, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'student' && [styles.activeTab, { backgroundColor: c.accentPrimary }]
              ]}
              onPress={() => setRole('student')}
            >
              <Text style={[styles.roleText, { color: role === 'student' ? '#ffffff' : c.textSecondary }]}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'teacher' && [styles.activeTab, { backgroundColor: c.accentSecondary }]
              ]}
              onPress={() => setRole('teacher')}
            >
              <Text style={[styles.roleText, { color: role === 'teacher' ? '#ffffff' : c.textSecondary }]}>Teacher</Text>
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <View style={s.glassCard}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                nameFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="person" size={18} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput]}
                  placeholder={role === 'teacher' ? 'Dr. Muhammad Summair Raza' : 'Ahmed Ali'}
                  placeholderTextColor={c.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Official UOS Email</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                emailFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="mail" size={18} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput]}
                  placeholder="username@uos.edu.pk"
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
                passFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="lock-closed" size={18} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput]}
                  placeholder="••••••••"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={18} color={c.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditionally render student fields */}
            {role === 'student' && (
              <View style={styles.studentFieldsContainer}>
                {/* Program Selector */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>Academic Program</Text>
                  <View style={styles.pickerToggleContainer}>
                    {programs.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.chip,
                          { backgroundColor: c.bgTertiary, borderColor: c.glassBorder },
                          program === p && { backgroundColor: c.accentGlow, borderColor: c.accentPrimary }
                        ]}
                        onPress={() => setProgram(p)}
                      >
                        <Text style={[styles.chipText, { color: program === p ? c.accentPrimary : c.textSecondary }]}>
                          {p.replace('BS in ', '')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Session Batch */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>Session / Batch</Text>
                  <View style={[
                    styles.inputWrapper,
                    { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                    batchFocused && { borderColor: c.accentPrimary }
                  ]}>
                    <TextInput
                      style={[s.bodyText, styles.textInput, { paddingLeft: 4 }]}
                      placeholder="2024-2028"
                      placeholderTextColor={c.textMuted}
                      value={batch}
                      onChangeText={setBatch}
                      onFocus={() => setBatchFocused(true)}
                      onBlur={() => setBatchFocused(false)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Semester Selector */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>Semester</Text>
                  <View style={styles.semesterList}>
                    {semesters.slice(0, 8).map((sem) => (
                      <TouchableOpacity
                        key={sem}
                        style={[
                          styles.semBadge,
                          { backgroundColor: c.bgTertiary },
                          semester === sem && { backgroundColor: c.accentPrimary }
                        ]}
                        onPress={() => setSemester(sem)}
                      >
                        <Text style={[styles.semText, { color: semester === sem ? '#ffffff' : c.textSecondary }]}>
                          {sem}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Admission Type (Support Category) */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>Admission Status</Text>
                  <View style={styles.typeBadgeRow}>
                    {types.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeBadge,
                          { backgroundColor: c.bgTertiary, borderColor: c.glassBorder },
                          type === t && { backgroundColor: c.accentGlow, borderColor: c.accentPrimary }
                        ]}
                        onPress={() => setType(t)}
                      >
                        <Text style={[styles.typeBadgeText, { color: type === t ? c.accentPrimary : c.textSecondary }]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Register button */}
            <TouchableOpacity
              style={[
                s.btn,
                s.btnPrimary,
                { backgroundColor: role === 'student' ? c.accentPrimary : c.accentSecondary, marginTop: 10 }
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={s.btnTextPrimary}>CREATE PROFILE</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Screen Switcher */}
          <TouchableOpacity onPress={onToggleAuth} style={styles.registerToggle}>
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>
              Already registered?{' '}
              <Text style={{ color: role === 'student' ? c.accentPrimary : c.accentSecondary, fontWeight: '700' }}>
                Log in Here
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoOutline: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
  },
  titleText: {
    marginBottom: 4,
    fontSize: 24,
    textAlign: 'center',
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
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  studentFieldsContainer: {
    width: '100%',
    marginTop: 6,
  },
  pickerToggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  flexRow: {
    flexDirection: 'row',
    width: '100%',
  },
  semesterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  semBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semText: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  typeBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  registerToggle: {
    marginTop: 16,
  }
});
