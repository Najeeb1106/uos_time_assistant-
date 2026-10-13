import React, { useState, useEffect } from 'react';
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
  BackHandler,
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

import {
  DEPARTMENTS,
  DEGREE_LEVELS,
  INTAKE_TERMS,
  SEMESTER_OPTIONS,
  getDepartments,
  getProgramsByDepartmentAndLevel,
  getProgramById,
  findProgramByOfficialOrLegacyName,
  getAvailableShiftsForProgram,
  getAvailableSectionsForShift,
  generateDynamicBatches,
  deriveLegacyType,
  DepartmentId,
  DegreeLevel,
  IntakeTerm,
  StudyShift,
  ProgramDefinition,
} from '../../constants/academicRegistry';
import { DEGREE_PROGRAMS } from '../../constants/degreePrograms';
import { parseBatch } from '../../utils/batchUtils';

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Student academic fields
  const [departmentId, setDepartmentId] = useState<DepartmentId>('se');
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>('BS');
  const [programId, setProgramId] = useState<string>('bs_se');
  const [intakeTerm, setIntakeTerm] = useState<IntakeTerm>('Fall');
  const [studyShift, setStudyShift] = useState<StudyShift>('Regular');
  const [sectionNumber, setSectionNumber] = useState<string>('1');
  const [semester, setSemester] = useState<number>(1);

  // Dynamic program resolution
  const currentProgramDef =
    getProgramById(programId) ||
    getProgramsByDepartmentAndLevel(departmentId, degreeLevel)[0];

  const dynamicBatchOptions = generateDynamicBatches(currentProgramDef);
  const [batch, setBatch] = useState<string>(() => dynamicBatchOptions[0] || '2024-2028');

  // Handle department change
  const handleSelectDepartment = (newDeptId: DepartmentId) => {
    setDepartmentId(newDeptId);
    const availableProgs = getProgramsByDepartmentAndLevel(newDeptId, degreeLevel);
    const nextProg = availableProgs[0];
    if (nextProg) {
      setProgramId(nextProg.id);
      const shifts = getAvailableShiftsForProgram(nextProg);
      const nextShift = shifts.includes(studyShift) ? studyShift : shifts[0];
      setStudyShift(nextShift);
      const secs = getAvailableSectionsForShift(nextProg, nextShift);
      if (!secs.includes(sectionNumber)) {
        setSectionNumber(secs[0] || '1');
      }
      const newBatches = generateDynamicBatches(nextProg);
      if (!newBatches.includes(batch)) {
        setBatch(newBatches[0] || '2024-2028');
      }
    }
    setActivePicker(null);
    setLocalError('');
  };

  // Handle degree level change
  const handleSelectDegreeLevel = (newLevel: DegreeLevel) => {
    setDegreeLevel(newLevel);
    const availableProgs = getProgramsByDepartmentAndLevel(departmentId, newLevel);
    const nextProg = availableProgs[0];
    if (nextProg) {
      setProgramId(nextProg.id);
      const shifts = getAvailableShiftsForProgram(nextProg);
      const nextShift = shifts.includes(studyShift) ? studyShift : shifts[0];
      setStudyShift(nextShift);
      const secs = getAvailableSectionsForShift(nextProg, nextShift);
      if (!secs.includes(sectionNumber)) {
        setSectionNumber(secs[0] || '1');
      }
      const newBatches = generateDynamicBatches(nextProg);
      if (!newBatches.includes(batch)) {
        setBatch(newBatches[0] || '2024-2028');
      }
    }
    setActivePicker(null);
    setLocalError('');
  };

  // Handle program change
  const handleSelectProgram = (newProgId: string) => {
    setProgramId(newProgId);
    const progDef = getProgramById(newProgId);
    if (progDef) {
      const shifts = getAvailableShiftsForProgram(progDef);
      const nextShift = shifts.includes(studyShift) ? studyShift : shifts[0];
      setStudyShift(nextShift);
      const secs = getAvailableSectionsForShift(progDef, nextShift);
      if (!secs.includes(sectionNumber)) {
        setSectionNumber(secs[0] || '1');
      }
      const newBatches = generateDynamicBatches(progDef);
      if (!newBatches.includes(batch)) {
        setBatch(newBatches[0] || '2024-2028');
      }
    }
    setActivePicker(null);
    setLocalError('');
  };

  // Handle study shift change
  const handleSelectStudyShift = (newShift: StudyShift) => {
    setStudyShift(newShift);
    const secs = getAvailableSectionsForShift(currentProgramDef, newShift);
    if (!secs.includes(sectionNumber)) {
      setSectionNumber(secs[0] || '1');
    }
    setActivePicker(null);
    setLocalError('');
  };

  // Teacher fields
  const [department, setDepartment] = useState('Software Engineering');
  const [designation, setDesignation] = useState('Lecturer');
  const [employeeId, setEmployeeId] = useState('');
  const [teachingId, setTeachingId] = useState('');

  // Dropdown Picker Modal active state
  const [activePicker, setActivePicker] = useState<
    | 'studentDepartment'
    | 'degreeLevel'
    | 'program'
    | 'intakeTerm'
    | 'batch'
    | 'semester'
    | 'studyShift'
    | 'section'
    | 'teacherDepartment'
    | 'designation'
    | null
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

  // Android hardware back button handler: navigates back one step if beyond step 1
  useEffect(() => {
    const onBackPress = () => {
      if (currentStep > 1) {
        setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
        setLocalError('');
        clearError();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentStep]);

  // Validation functions
  const validateStep1 = () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!fullName.trim()) {
      setLocalError('Please enter your full name.');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return false;
    }
    if (!confirmPassword) {
      setLocalError('Please confirm your password.');
      return false;
    }
    if (confirmPassword !== password) {
      setLocalError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const validateStep2 = () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!departmentId) {
      setLocalError('Please select a department.');
      return false;
    }
    if (!degreeLevel) {
      setLocalError('Please select a degree level.');
      return false;
    }
    if (!programId) {
      setLocalError('Please select a degree program.');
      return false;
    }
    if (!intakeTerm) {
      setLocalError('Please select a session / intake term.');
      return false;
    }
    if (!batch.trim() || !/^\d{4}-\d{4}$/.test(batch.trim())) {
      setLocalError('Please select a valid Batch / Session (YYYY-YYYY).');
      return false;
    }
    const parsed = parseBatch(batch);
    if (Number(parsed.endYear) <= Number(parsed.startYear)) {
      setLocalError('Batch End Year must be later than Start Year.');
      return false;
    }
    if (!semester || semester < 1 || semester > 8) {
      setLocalError('Please select an active semester (Semester 1 - 8).');
      return false;
    }
    return true;
  };

  const validateTeacherStep2 = () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!department.trim()) {
      setLocalError('Please select a faculty department.');
      return false;
    }
    if (!designation.trim()) {
      setLocalError('Please select a designation.');
      return false;
    }
    if (!employeeId.trim()) {
      setLocalError('Please enter your Faculty Employee ID.');
      return false;
    }
    if (!teachingId.trim()) {
      setLocalError('Please enter your Teaching ID.');
      return false;
    }
    return true;
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  const validateStep3 = () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!studyShift) {
      setLocalError('Please select a study shift.');
      return false;
    }
    if (!sectionNumber) {
      setLocalError('Please select a section.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (isLoading) return;
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (role === 'student') {
      if (!validateStep2()) {
        setCurrentStep(2);
        return;
      }
      if (!validateStep3()) {
        setCurrentStep(3);
        return;
      }
    } else {
      if (!validateTeacherStep2()) {
        setCurrentStep(2);
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
        const progDef = getProgramById(programId);
        const officialProgram = progDef?.officialPdfName || progDef?.label || 'BS in Software Engineering';
        const derivedType = deriveLegacyType(studyShift, sectionNumber);

        // Additive academic registry fields
        payload.departmentId = departmentId;
        payload.degreeLevel = degreeLevel;
        payload.programId = programId;
        payload.intakeTerm = intakeTerm;
        payload.studyShift = studyShift;
        payload.sectionNumber = sectionNumber;

        // Legacy compatibility fields
        payload.program = officialProgram;
        payload.type = derivedType;
        payload.batch = batch.trim();
        payload.semester = Number(semester);
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

  const totalSteps = role === 'student' ? 3 : 2;

  const getStepTitle = () => {
    if (currentStep === 1) return 'Personal Information';
    if (currentStep === 2) return role === 'student' ? 'Academic Information' : 'Faculty Information';
    return 'Study Details & Review';
  };

  const getStepSubtitle = () => {
    if (currentStep === 1) return 'Set up your credentials & basic info';
    if (currentStep === 2) return role === 'student' ? 'Select program, session & active semester' : 'Select faculty credentials & department';
    return 'Configure study shift, section & review';
  };

  const errorMessage = localError || storeError;
  const selectedDepartmentLabel =
    DEPARTMENTS.find((d) => d.id === departmentId)?.name || 'Select Department';
  const selectedProgramLabel =
    currentProgramDef?.label || 'Select Program';

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
              onPress={() => {
                if (currentStep > 1) {
                  setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
                  setLocalError('');
                  clearError();
                } else {
                  navigation.goBack();
                }
              }}
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
              {/* Wizard Progress Indicator */}
              <View style={styles.wizardProgressContainer}>
                <View style={styles.wizardHeaderRow}>
                  <View style={[styles.wizardBadge, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]}>
                    <Text style={[styles.wizardBadgeText, { color: colors.primary }]}>
                      STEP {currentStep} OF {totalSteps}
                    </Text>
                  </View>
                  <Text style={[styles.wizardStepTitle, { color: colors.textPrimary }]}>
                    {getStepTitle()}
                  </Text>
                </View>
                <Text style={[styles.wizardStepSubtitle, { color: colors.textSecondary }]}>
                  {getStepSubtitle()}
                </Text>
                <View style={styles.wizardProgressBar}>
                  {Array.from({ length: totalSteps }).map((_, idx) => {
                    const stepNum = idx + 1;
                    const isCompletedOrActive = currentStep >= stepNum;
                    return (
                      <View
                        key={stepNum}
                        style={[
                          styles.wizardSegment,
                          {
                            backgroundColor: isCompletedOrActive
                              ? colors.buttonGradientStart
                              : colors.border,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
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
                {/* STEP 1: Personal Information */}
                {currentStep === 1 && (
                  <>
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

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm Password</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          focusedField === 'confirmPassword' && {
                            borderColor: colors.primary,
                            backgroundColor: colors.badgeBg,
                          },
                        ]}
                      >
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={15}
                          color={focusedField === 'confirmPassword' ? colors.primary : colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Re-enter password"
                          placeholderTextColor={colors.textMuted}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (localError || storeError) {
                              setLocalError('');
                              clearError();
                            }
                          }}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => setFocusedField(null)}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                        />
                        <Pressable
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeButton}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={15}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* Step 1 Continue Button */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.submitButton,
                        { backgroundColor: colors.buttonGradientStart },
                        pressed && styles.submitButtonPressed,
                      ]}
                      onPress={handleNextFromStep1}
                    >
                      <View style={styles.buttonContent}>
                        <Text style={styles.submitButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                      </View>
                    </Pressable>
                  </>
                )}

                {/* STEP 2: Academic Information (Student) */}
                {currentStep === 2 && role === 'student' && (
                  <>
                    {/* 1. Department Dropdown */}
                    <SelectTrigger
                      label="Department"
                      value={selectedDepartmentLabel}
                      iconName="business-outline"
                      onPress={() => setActivePicker('studentDepartment')}
                      colors={colors}
                    />

                    {/* 2. Degree Level Dropdown */}
                    <SelectTrigger
                      label="Degree Level"
                      value={degreeLevel}
                      iconName="ribbon-outline"
                      onPress={() => setActivePicker('degreeLevel')}
                      colors={colors}
                    />

                    {/* 3. Degree Program Dropdown */}
                    <SelectTrigger
                      label="Degree Program"
                      value={selectedProgramLabel}
                      iconName="school-outline"
                      onPress={() => setActivePicker('program')}
                      colors={colors}
                    />

                    {/* 4. Session / Intake Dropdown */}
                    <SelectTrigger
                      label="Session / Intake"
                      value={intakeTerm}
                      iconName="sunny-outline"
                      onPress={() => setActivePicker('intakeTerm')}
                      colors={colors}
                    />

                    {/* 5. Batch Dropdown */}
                    <SelectTrigger
                      label="Batch / Session"
                      value={batch || 'Select Batch'}
                      iconName="calendar-outline"
                      onPress={() => setActivePicker('batch')}
                      colors={colors}
                    />

                    {/* 6. Active Semester Dropdown */}
                    <SelectTrigger
                      label="Active Semester"
                      value={`Semester ${semester}`}
                      iconName="time-outline"
                      onPress={() => setActivePicker('semester')}
                      colors={colors}
                    />

                    {/* Navigation Buttons */}
                    <View style={styles.wizardNavRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.wizardBackButton,
                          { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          setLocalError('');
                          clearError();
                          setCurrentStep(1);
                        }}
                      >
                        <Ionicons name="arrow-back" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
                        <Text style={[styles.wizardBackText, { color: colors.textPrimary }]}>Back</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.wizardContinueButton,
                          { backgroundColor: colors.buttonGradientStart },
                          pressed && styles.submitButtonPressed,
                        ]}
                        onPress={handleNextFromStep2}
                      >
                        <Text style={styles.submitButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                      </Pressable>
                    </View>
                  </>
                )}

                {/* STEP 2: Faculty Information (Teacher) */}
                {currentStep === 2 && role === 'teacher' && (
                  <>
                    {/* 1. Department Dropdown */}
                    <SelectTrigger
                      label="Department"
                      value={department}
                      iconName="business-outline"
                      onPress={() => setActivePicker('teacherDepartment')}
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

                    {/* Navigation Buttons for Teacher */}
                    <View style={styles.wizardNavRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.wizardBackButton,
                          { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          setLocalError('');
                          clearError();
                          setCurrentStep(1);
                        }}
                        disabled={isLoading}
                      >
                        <Ionicons name="arrow-back" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
                        <Text style={[styles.wizardBackText, { color: colors.textPrimary }]}>Back</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.wizardContinueButton,
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
                            <Text style={styles.submitButtonText}>Create Account</Text>
                            <Ionicons name="checkmark-circle" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </>
                )}

                {/* STEP 3: Study Details & Review (Student) */}
                {currentStep === 3 && role === 'student' && (
                  <>
                    {/* 7. Study Shift Dropdown */}
                    <SelectTrigger
                      label="Study Shift"
                      value={studyShift}
                      iconName="hourglass-outline"
                      onPress={() => setActivePicker('studyShift')}
                      colors={colors}
                    />

                    {/* 8. Section Dropdown */}
                    <SelectTrigger
                      label="Section"
                      value={`Section ${sectionNumber}`}
                      iconName="layers-outline"
                      onPress={() => setActivePicker('section')}
                      colors={colors}
                    />

                    {/* Compact Review Card */}
                    <View
                      style={[
                        styles.reviewCard,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.reviewHeader}>
                        <Ionicons
                          name="checkmark-done-circle"
                          size={15}
                          color={colors.primary}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.reviewTitle, { color: colors.textPrimary }]}>
                          Registration Summary
                        </Text>
                      </View>
                      <View style={styles.reviewGrid}>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Student</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {fullName || '—'}
                          </Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Email</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {email || '—'}
                          </Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Department</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {selectedDepartmentLabel}
                          </Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Program</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {degreeLevel} • {selectedProgramLabel}
                          </Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Session & Batch</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {intakeTerm} • {batch}
                          </Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Term & Shift</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            Semester {semester} • {studyShift}
                          </Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Section</Text>
                          <Text style={[styles.reviewValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            Section {sectionNumber}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Navigation Buttons for Step 3 */}
                    <View style={styles.wizardNavRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.wizardBackButton,
                          { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          setLocalError('');
                          clearError();
                          setCurrentStep(2);
                        }}
                        disabled={isLoading}
                      >
                        <Ionicons name="arrow-back" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
                        <Text style={[styles.wizardBackText, { color: colors.textPrimary }]}>Back</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.wizardContinueButton,
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
                            <Text style={styles.submitButtonText}>Create Account</Text>
                            <Ionicons name="checkmark-circle" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </>
                )}
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

        {/* 1. Student Department Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'studentDepartment'}
          title="Select Department"
          options={DEPARTMENTS.map((d) => ({
            value: d.id,
            label: `${d.name} (${d.code})`,
          }))}
          selectedValue={departmentId}
          onSelect={(val) => handleSelectDepartment(val as DepartmentId)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 2. Degree Level Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'degreeLevel'}
          title="Select Degree Level"
          options={DEGREE_LEVELS.map((lvl) => ({
            value: lvl,
            label: lvl,
          }))}
          selectedValue={degreeLevel}
          onSelect={(val) => handleSelectDegreeLevel(val as DegreeLevel)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 3. Degree Program Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'program'}
          title="Select Degree Program"
          options={getProgramsByDepartmentAndLevel(departmentId, degreeLevel).map((p) => ({
            value: p.id,
            label: p.label,
          }))}
          selectedValue={programId}
          onSelect={(val) => handleSelectProgram(String(val))}
          onClose={() => setActivePicker(null)}
          searchable
          colors={colors}
          isDark={isDark}
        />

        {/* 4. Session / Intake Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'intakeTerm'}
          title="Select Session / Intake"
          options={INTAKE_TERMS.map((term) => ({
            value: term,
            label: term,
          }))}
          selectedValue={intakeTerm}
          onSelect={(val) => {
            setIntakeTerm(val as IntakeTerm);
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 5. Batch Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'batch'}
          title="Select Batch / Session"
          options={dynamicBatchOptions.map((b) => ({
            value: b,
            label: b,
          }))}
          selectedValue={batch}
          onSelect={(val) => {
            setBatch(String(val));
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
          searchable
          colors={colors}
          isDark={isDark}
        />

        {/* 6. Active Semester Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'semester'}
          title="Select Active Semester"
          options={SEMESTER_OPTIONS}
          selectedValue={semester}
          onSelect={(val) => {
            setSemester(Number(val));
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 7. Study Shift Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'studyShift'}
          title="Select Study Shift"
          options={getAvailableShiftsForProgram(currentProgramDef).map((s) => ({
            value: s,
            label: s,
          }))}
          selectedValue={studyShift}
          onSelect={(val) => handleSelectStudyShift(val as StudyShift)}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* 8. Section Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'section'}
          title="Select Section"
          options={getAvailableSectionsForShift(currentProgramDef, studyShift).map((sec) => ({
            value: sec,
            label: `Section ${sec}`,
          }))}
          selectedValue={sectionNumber}
          onSelect={(val) => {
            setSectionNumber(String(val));
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* Teacher Department Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'teacherDepartment'}
          title="Select Department"
          options={DEPARTMENT_OPTIONS}
          selectedValue={department}
          onSelect={(val) => {
            setDepartment(String(val));
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
          colors={colors}
          isDark={isDark}
        />

        {/* Teacher Designation Bottom Sheet */}
        <SelectBottomSheet
          visible={activePicker === 'designation'}
          title="Select Designation"
          options={DESIGNATION_OPTIONS}
          selectedValue={designation}
          onSelect={(val) => {
            setDesignation(String(val));
            setActivePicker(null);
          }}
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
  batchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchCol: {
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
  wizardProgressContainer: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  wizardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  wizardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  wizardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  wizardStepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  wizardStepSubtitle: {
    fontSize: 11,
    marginBottom: 6,
  },
  wizardProgressBar: {
    flexDirection: 'row',
    gap: 6,
    height: 3.5,
    width: '100%',
  },
  wizardSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  wizardNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  wizardBackButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardBackText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  wizardContinueButton: {
    flex: 2,
    flexDirection: 'row',
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  reviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  reviewGrid: {
    gap: 5,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 11.5,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
});
