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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthNavigationProp } from '../../navigation/types';
import { useMobileStore } from '../../stores/useMobileStore';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function LoginScreen() {
  const navigation = useNavigation<AuthNavigationProp<'Login'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const login = useMobileStore((state) => state.login);
  const isLoading = useMobileStore((state) => state.isLoading);
  const storeError = useMobileStore((state) => state.error);
  const clearError = useMobileStore((state) => state.clearError);

  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teachingId, setTeachingId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (role === 'teacher' && !teachingId.trim()) {
      setLocalError('Faculty members must provide their Teaching ID.');
      return;
    }

    try {
      await login({
        email: email.trim(),
        password,
        ...(role === 'teacher' ? { teachingId: teachingId.trim() } : {}),
      });
    } catch {
      // Handled by store
    }
  };

  const errorMessage = localError || storeError;

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


        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Branding Section */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Image
                  source={require('../../../assets/uos.png')}
                  style={styles.crestLogo}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.welcomeSubhead, { color: colors.textSecondary }]}>WELCOME TO</Text>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>UOS</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>ACADEMIC TIMETABLE ASSISTANT</Text>
              <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
                View your department schedule, track lecture timings, and discover free classrooms across campus.
              </Text>
            </View>

            {/* Role Switcher Pill */}
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
                  size={15}
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
                  size={15}
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
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields Card */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0.25 : 0.06,
                },
              ]}
            >
              {/* Email Field */}
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
                    size={16}
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

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Security Password</Text>
                  <Pressable
                    onPress={() => {
                      clearError();
                      navigation.navigate('ForgotPassword');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.forgotPasswordText, { color: colors.primaryLight }]}>Forgot password?</Text>
                  </Pressable>
                </View>
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
                    size={16}
                    color={focusedField === 'password' ? colors.primary : colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="••••••••"
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
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Conditional Faculty Teaching ID */}
              {role === 'teacher' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Faculty Teaching ID</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      focusedField === 'teachingId' && {
                        borderColor: colors.primary,
                        backgroundColor: colors.badgeBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={16}
                      color={focusedField === 'teachingId' ? colors.primary : colors.textMuted}
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
                      onFocus={() => setFocusedField('teachingId')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              {/* Primary Sign In Pill Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.signInButton,
                  { backgroundColor: colors.buttonGradientStart },
                  pressed && styles.signInButtonPressed,
                  isLoading && styles.signInButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </Pressable>
            </View>

            {/* Footer Registration Link */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <Pressable
                onPress={() => {
                  clearError();
                  navigation.navigate('Register');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={[styles.signUpLinkText, { color: colors.primaryLight }]}>Sign Up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  crestLogo: {
    width: 44,
    height: 44,
  },
  welcomeSubhead: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    marginBottom: 10,
    height: 34,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  roleIcon: {
    marginRight: 5,
  },
  roleText: {
    fontSize: Typography.sizes.xs,
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
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
    lineHeight: 16,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  signInButton: {
    borderRadius: 9999,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  signInButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    fontSize: Typography.sizes.xs,
  },
  signUpLinkText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
});
