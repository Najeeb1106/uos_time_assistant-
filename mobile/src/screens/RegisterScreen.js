// High-Fidelity Glassmorphic Register Screen for UOS Timetable
import React, { useState, useEffect } from 'react';
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
  Alert,
  Image,
  Keyboard,
  Modal
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

  // Dropdown menus open state
  const [programDropdownOpen, setProgramDropdownOpen] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);

  // Keyboard scrolling control (Layout does not scroll when keyboard is closed)
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const register = useMobileStore((state) => state.register);
  const theme = useMobileStore((state) => state.themeMode);
  
  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  // Program Options Picker List (Matches Web exactly)
  const programs = [
    'BS in Software Engineering',
    'BS in Computer Science',
    'BS in Information Technology',
    'MS in Software Engineering'
  ];

  const types = ['Regular', 'Self Support 1', 'Self Support 2'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const getProgramLabel = (name) => {
    if (name === 'BS in Software Engineering') return 'BS Software Eng.';
    if (name === 'BS in Computer Science') return 'BS Computer Sci.';
    if (name === 'BS in Information Technology') return 'BS Info. Tech.';
    if (name === 'MS in Software Engineering') return 'MS Software Eng.';
    return name;
  };

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
      Alert.alert('Password Criteria', 'For account security, your password must be at least 6 characters.');
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          scrollEnabled={keyboardVisible} // Fixed single-screen layout, scrolls ONLY when keyboard is open
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/uos.png')}
              style={{ width: 44, height: 44, resizeMode: 'contain', marginBottom: 6 }}
            />
            <Text style={[s.title, styles.titleText]}>
              {role === 'student' ? 'Create Student Profile' : 'Create Teacher Profile'}
            </Text>
            <Text style={[s.mutedText, styles.subtitleText]}>
              {role === 'student' 
                ? 'Establish your academic details to align your parsed timetable' 
                : 'Enter your name and official UOS email to custom filter your teaching schedule'}
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
          <View style={[s.glassCard, { padding: 12, marginBottom: 8 }]}>
            {/* 1. Official UOS Email */}
            <View style={[s.inputGroup, { marginBottom: 6 }]}>
              <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Official UOS Email</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                emailFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="mail" size={16} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput, { fontSize: 13 }]}
                  placeholder={role === 'teacher' ? 'teacher@uos.edu.pk' : 'name@uos.edu.pk'}
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

            {/* 2. Full Name */}
            <View style={[s.inputGroup, { marginBottom: 6 }]}>
              <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                nameFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="person" size={16} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput, { fontSize: 13 }]}
                  placeholder={role === 'teacher' ? 'Dr. Afzal Badshah' : 'Ahmed Ali'}
                  placeholderTextColor={c.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* 3. Security Password */}
            <View style={[s.inputGroup, { marginBottom: 6 }]}>
              <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Security Password</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                passFocused && { borderColor: role === 'student' ? c.accentPrimary : c.accentSecondary }
              ]}>
                <Ionicons name="lock-closed" size={16} color={c.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[s.bodyText, styles.textInput, { fontSize: 13 }]}
                  placeholder="Min 6 characters"
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
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={16} color={c.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditionally render student fields */}
            {role === 'student' && (
              <View style={styles.studentFieldsContainer}>
                {/* Degree Program Dropdown */}
                <View style={[s.inputGroup, { marginBottom: 6 }]}>
                  <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Degree Program</Text>
                  <TouchableOpacity
                    style={[styles.dropdownSelect, { backgroundColor: c.inputBg, borderColor: c.glassBorder }]}
                    onPress={() => setProgramDropdownOpen(true)}
                  >
                    <Ionicons name="school" size={16} color={c.textMuted} style={styles.inputIcon} />
                    <Text style={[s.bodyText, { flex: 1, fontSize: 13, color: program ? c.textPrimary : c.textMuted }]}>
                      {program ? getProgramLabel(program) : 'Select Degree Program'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* 2-Column Row for Batch & Semester to save vertical space */}
                <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 6 }}>
                  {/* Session Batch */}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Session / Batch</Text>
                    <View style={[
                      styles.inputWrapper,
                      { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                      batchFocused && { borderColor: c.accentPrimary }
                    ]}>
                      <TextInput
                        style={[s.bodyText, styles.textInput, { paddingLeft: 4, fontSize: 13 }]}
                        placeholder="e.g. 2024-2028"
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

                  {/* Active Semester Dropdown */}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Active Semester</Text>
                    <TouchableOpacity
                      style={[styles.dropdownSelect, { backgroundColor: c.inputBg, borderColor: c.glassBorder }]}
                      onPress={() => setSemesterDropdownOpen(true)}
                    >
                      <Ionicons name="calendar" size={16} color={c.textMuted} style={styles.inputIcon} />
                      <Text style={[s.bodyText, { flex: 1, fontSize: 13, color: semester ? c.textPrimary : c.textMuted }]}>
                        {semester ? `Semester ${semester}` : 'Select Semester'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Admission Type (Support Category) */}
                <View style={[s.inputGroup, { marginBottom: 6 }]}>
                  <Text style={[s.inputLabel, { marginBottom: 4, fontSize: 11 }]}>Support Type</Text>
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
                          {t === 'Self Support 1' ? 'Self 1' : t === 'Self Support 2' ? 'Self 2' : t}
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
                { 
                  backgroundColor: role === 'student' ? c.accentPrimary : c.accentSecondary, 
                  marginTop: 6,
                  paddingVertical: 10,
                  height: 40
                }
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={[s.btnTextPrimary, { fontSize: 14 }]}>Complete Registration</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Screen Switcher */}
          <TouchableOpacity onPress={onToggleAuth} style={styles.registerToggle}>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              Already have a profile?{' '}
              <Text style={{ color: role === 'student' ? c.accentPrimary : c.accentSecondary, fontWeight: '700' }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>

      {/* Program Dropdown Modal Overlay */}
      <Modal
        visible={programDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProgramDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProgramDropdownOpen(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select Degree Program</Text>
            {programs.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.modalItem,
                  { borderBottomColor: c.glassBorder },
                  program === p && { backgroundColor: c.accentGlow }
                ]}
                onPress={() => {
                  setProgram(p);
                  setProgramDropdownOpen(false);
                }}
              >
                <Text style={[s.bodyText, { color: program === p ? c.accentPrimary : c.textPrimary, fontWeight: program === p ? '700' : '400' }]}>
                  {p}
                </Text>
                {program === p && <Ionicons name="checkmark" size={18} color={c.accentPrimary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Semester Dropdown Modal Overlay */}
      <Modal
        visible={semesterDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSemesterDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSemesterDropdownOpen(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select Active Semester</Text>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {semesters.map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: c.glassBorder },
                    semester === sem && { backgroundColor: c.accentGlow }
                  ]}
                  onPress={() => {
                    setSemester(sem);
                    setSemesterDropdownOpen(false);
                  }}
                >
                  <Text style={[s.bodyText, { color: semester === sem ? c.accentPrimary : c.textPrimary, fontWeight: semester === sem ? '700' : '400' }]}>
                    Semester {sem}
                  </Text>
                  {semester === sem && <Ionicons name="checkmark" size={18} color={c.accentPrimary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    marginBottom: 2,
    fontSize: 20,
    textAlign: 'center',
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 11,
    paddingHorizontal: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
    width: '100%',
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
  },
  dropdownSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    width: '100%',
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
    marginTop: 2,
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
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  registerToggle: {
    marginTop: 10,
  },
  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  }
});
