import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthNavigationProp } from '../../navigation/types';
import { useMobileStore } from '../../stores/useMobileStore';
import { lightColors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useScheduleStore } from '../../stores/useScheduleStore';
import SelectBottomSheet from '../../components/common/SelectBottomSheet';
import SelectTrigger from '../../components/common/SelectTrigger';

import { DEGREE_PROGRAMS } from '../../constants/degreePrograms';

const SECTION_OPTIONS = [
  'Regular',
  'Self Support 1',
  'Self Support 2',
];

const SEMESTER_OPTIONS = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' },
  { value: 3, label: 'Semester 3' },
  { value: 4, label: 'Semester 4' },
  { value: 5, label: 'Semester 5' },
  { value: 6, label: 'Semester 6' },
  { value: 7, label: 'Semester 7' },
  { value: 8, label: 'Semester 8' },
];

const DEPARTMENT_OPTIONS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Artificial Intelligence',
  'Data Science',
  'Cyber Security',
];

const DESIGNATION_OPTIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Visiting Faculty',
];

export default function RegisterScreen() {
  const navigation = useNavigation<AuthNavigationProp<'Register'>>();
  const insets = useSafeAreaInsets();
  const colors = lightColors;
  const isDark = false;
  const register = useMobileStore((state) => state.register);
  const isLoading = useMobileStore((state) => state.isLoading);
  const storeError = useMobileStore((state) => state.error);
  const clearError = useMobileStore((state) => state.clearError);

  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Student fields
  const [program, setProgram] = useState('BS in Software Engineering');
  const [type, setType] = useState('Regular');
  const [batch, setBatch] = useState('2024-2028');
  const [semester, setSemester] = useState<number>(1);

  // Teacher fields
  const [department, setDepartment] = useState('Software Engineering');
  const [designation, setDesignation] = useState('Lecturer');
  const [employeeId, setEmployeeId] = useState('');
  const [teachingId, setTeachingId] = useState('');

  // Dropdown Picker Modal active state
  const [activePicker, setActivePicker] = useState<
    'program' | 'section' | 'semester' | 'department' | 'designation' | null
  >(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const getStrengthMeta = (score: number) => {
    if (score === 0) return { label: '', color: 'transparent', width: '0%' };
    if (score <= 2) return { label: 'Weak', color: colors.error, width: '33%' };
    if (score <= 4) return { label: 'Medium', color: colors.warning, width: '66%' };
    return { label: 'Strong', color: colors.success, width: '100%' };
  };

  const strengthScore = getPasswordStrength(password);
  const strengthMeta = getStrengthMeta(strengthScore);

  const handleRegister = async () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!fullName.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all required credentials.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (role === 'teacher') {
      if (!department.trim() || !designation.trim() || !employeeId.trim() || !teachingId.trim()) {
        setLocalError('Please fill in all faculty details including Employee ID and Teaching ID.');
        return;
      }
    }

    try {
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      };

      if (role === 'student') {
        payload.program = program;
        payload.type = type;
        payload.batch = batch.trim();
        payload.semester = semester;
      } else {
        payload.department = department;
        payload.designation = designation;
        payload.employeeId = employeeId.trim();
        payload.teachingId = teachingId.trim();
      }

      await register(payload);
      useScheduleStore.getState().fetchCurrentSchedule().catch(() => {});
    } catch {
      // Error handled by store
    }
  };

  const errorMessage = localError || storeError;
  const selectedProgramLabel =
    DEGREE_PROGRAMS.find((p) => p.value === program)?.label || program;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: colors.background,
          },
        ]}
      >
        <StatusBar style="dark" />
        {/* Top Header Bar */}
        <View style={[styles.topNavBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.topNavLeft}>
            <Pressable
              style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.topNavTitle, { color: colors.textPrimary }]}>
              {role === 'student' ? 'Create Student Profile' : 'Create Teacher Profile'}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 16 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centeredWrapper}>
              {/* Role Switcher */}
              <View
                style={[
                  styles.roleContainer,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.roleButton,
                    role === 'student' && { backgroundColor: colors.buttonGradientStart },
                  ]}
                  onPress={() => {
                    setRole('student');
                    setLocalError('');
                    clearError();
                  }}
                >
                  <Ionicons
                    name="school-outline"
                    size={13}
                    color={role === 'student' ? '#ffffff' : colors.textSecondary}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      { color: colors.textSecondary },
                      role === 'student' && styles.roleTextActive,
                    ]}
                  >
                    Student
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleButton,
                    role === 'teacher' && { backgroundColor: colors.buttonGradientStart },
                  ]}
                  onPress={() => {
                    setRole('teacher');
                    setLocalError('');
                    clearError();
                  }}
                >
                  <Ionicons
                    name="person-outline"
                    size={13}
                    color={role === 'teacher' ? '#ffffff' : colors.textSecondary}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      { color: colors.textSecondary },
                      role === 'teacher' && styles.roleTextActive,
                    ]}
                  >
                    Teacher
                  </Text>
                </Pressable>
              </View>

              {/* Error Message Card */}
              {errorMessage ? (
                <View style={[styles.errorCard, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Card */}
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowOpacity: isDark ? 0.2 : 0.05,
                  },
                ]}
              >
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      focusedField === 'name' && {
                        borderColor: colors.primary,
                        backgroundColor: colors.badgeBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={15}
                      color={focusedField === 'name' ? colors.primary : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.textMuted}
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (localError || storeError) {
                          setLocalError('');
                          clearError();
                        }
                      }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      focusedField === 'email' && {
                        borderColor: colors.primary,
                        backgroundColor: colors.badgeBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={15}
                      color={focusedField === 'email' ? colors.primary : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Enter your email address"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (localError || storeError) {
                          setLocalError('');
                          clearError();
                        }
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Security Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Security Password</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      focusedField === 'password' && {
                        borderColor: colors.primary,
                        backgroundColor: colors.badgeBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={15}
                      color={focusedField === 'password' ? colors.primary : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Create password (min 6 chars)"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (localError || storeError) {
                          setLocalError('');
                          clearError();
                        }
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={15}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={[styles.strengthTrack, { backgroundColor: colors.surfaceElevated }]}>
                        <View
                          style={[
                            styles.strengthFill,
                            { width: strengthMeta.width as any, backgroundColor: strengthMeta.color },
                          ]}
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: strengthMeta.color }]}>
                        {strengthMeta.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* STUDENT CONTROLS */}
                {role === 'student' && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* 1. Degree Program Dropdown */}
                    <SelectTrigger
                      label="Degree Program"
                      value={selectedProgramLabel}
                      iconName="school-outline"
                      onPress={() => setActivePicker('program')}
                      colors={colors}
                    />

                    {/* 2. Section Dropdown */}
                    <SelectTrigger
                      label="Section"
                      value={type}
                      iconName="layers-outline"
                      onPress={() => setActivePicker('section')}
                      colors={colors}
                    />

                    {/* 3. Session / Batch Manual Text Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SESSION / BATCH</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          focusedField === 'batch' && {
                            borderColor: colors.primary,
                            backgroundColor: colors.badgeBg,
                          },
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={15}
                          color={focusedField === 'batch' ? colors.primary : colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Enter your session / batch"
                          placeholderTextColor={colors.textMuted}
                          value={batch}
                          onChangeText={(text) => {
                            setBatch(text);
                            if (localError || storeError) {
                              setLocalError('');
                              clearError();
                            }
                          }}
                          onFocus={() => setFocusedField('batch')}
                          onBlur={() => setFocusedField(null)}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    {/* 4. Active Semester Dropdown */}
                    <SelectTrigger
                      label="Active Semester"
                      value={`Semester ${semester}`}
                      iconName="time-outline"
                      onPress={() => setActivePicker('semester')}
                      colors={colors}
                    />
                  </>
                )}

                {/* TEACHER CONTROLS */}
                {role === 'teacher' && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* 1. Department Dropdown */}
                    <SelectTrigger
                      label="Department"
                      value={department}
                      iconName="business-outline"
                      onPress={() => setActivePicker('department')}
                      colors={colors}
                    />

                    {/* 2. Designation Dropdown */}
                    <SelectTrigger
                      label="Designation"
                      value={designation}
                      iconName="ribbon-outline"
                      onPress={() => setActivePicker('designation')}
                      colors={colors}
                    />

                    {/* Faculty Employee ID Text Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Faculty Employee ID</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          focusedField === 'empId' && {
                            borderColor: colors.primary,
                            backgroundColor: colors.badgeBg,
                          },
                        ]}
                      >
                        <Ionicons
                          name="id-card-outline"
                          size={15}
                          color={focusedField === 'empId' ? colors.primary : colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="e.g. EMP-9921"
                          placeholderTextColor={colors.textMuted}
                          value={employeeId}
                          onChangeText={(text) => {
                            setEmployeeId(text);
                            if (localError || storeError) {
                              setLocalError('');
                              clearError();
                            }
                          }}
                          onFocus={() => setFocusedField('empId')}
                          onBlur={() => setFocusedField(null)}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>

                    {/* Teaching ID Text Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Teaching ID</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          focusedField === 'tchId' && {
                            borderColor: colors.primary,
                            backgroundColor: colors.badgeBg,
                          },
                        ]}
                      >
                        <Ionicons
                          name="key-outline"
                          size={15}
                          color={focusedField === 'tchId' ? colors.primary : colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="e.g. TCH-481"
                          placeholderTextColor={colors.textMuted}
                          value={teachingId}
                          onChangeText={(text) => {
                            setTeachingId(text);
                            if (localError || storeError) {
                              setLocalError('');
                              clearError();
                            }
                          }}
                          onFocus={() => setFocusedField('tchId')}
                          onBlur={() => setFocusedField(null)}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Submit Pill Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    { backgroundColor: colors.buttonGradientStart },
                    pressed && styles.submitButtonPressed,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.submitButtonText}>Sign Up</Text>
                      <Ionicons name="arrow-forward" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Footer Link */}
              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                <Pressable
                  onPress={() => {
                    clearError();
                    navigation.navigate('Login');
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Text style={[styles.signInLinkText, { color: colors.primaryLight }]}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 1. Degree Program Bottom Sheet (Searchable) */}
        <SelectBottomSheet
          visible={activePicker === 'program'}
          title="Select Degree Program"
          options={DEGREE_PROGRAMS}
          selectedValue={program}
          onSelect={(val) => setProgram(val)}
          onClose={() => setActivePicker(null)}
          searchable
          colors={colors}
          isDark={isDark}
        />

        {/* 2. Section Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'section'}
          title="Select Section"
          options={SECTION_OPTIONS}
          selectedValue={type}
          onSelect={(val) => setType(val)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 3. Active Semester Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'semester'}
          title="Select Active Semester"
          options={SEMESTER_OPTIONS}
          selectedValue={semester}
          onSelect={(val) => setSemester(val)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 4. Teacher Department Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'department'}
          title="Select Department"
          options={DEPARTMENT_OPTIONS}
          selectedValue={department}
          onSelect={(val) => setDepartment(val)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 5. Teacher Designation Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'designation'}
          title="Select Designation"
          options={DESIGNATION_OPTIONS}
          selectedValue={designation}
          onSelect={(val) => setDesignation(val)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNavBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topNavTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  centeredWrapper: {
    width: '100%',
    justifyContent: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 2,
    borderWidth: 1,
    marginBottom: 4,
    height: 30,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  roleIcon: {
    marginRight: 4,
  },
  roleText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginBottom: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  strengthTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 9.5,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 3,
  },
  submitButton: {
    borderRadius: 9999,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 11,
  },
  signInLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
