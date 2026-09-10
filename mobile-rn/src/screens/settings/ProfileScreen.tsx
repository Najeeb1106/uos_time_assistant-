import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMobileStore } from '../../stores/useMobileStore';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import CollapsibleHeader, { TOOLBAR_HEIGHT } from '../../components/common/CollapsibleHeader';
import SelectBottomSheet from '../../components/common/SelectBottomSheet';
import { DEGREE_PROGRAMS } from '../../constants/degreePrograms';
import { normalizeBatch } from '../../utils/builtinScheduleUtils';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, isDark, toggleTheme, mode, setThemeMode } = useTheme();
  const headerTotalHeight = TOOLBAR_HEIGHT + insets.top;
  const scrollY = useRef(new Animated.Value(0)).current;

  const user = useMobileStore((state) => state.user);
  const updateProfile = useMobileStore((state) => state.updateProfile);
  const logout = useMobileStore((state) => state.logout);
  const isLoading = useMobileStore((state) => state.isLoading);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [program, setProgram] = useState(user?.program || '');
  const [semester, setSemester] = useState<number>(user?.semester !== undefined && user?.semester !== null ? Number(user.semester) : 1);
  const [batch, setBatch] = useState(user?.batch || '');
  const [type, setType] = useState(user?.type || 'Regular');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUri || null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active Dropdown state inside Modal
  const [activeDropdown, setActiveDropdown] = useState<'program' | 'semester' | 'section' | null>(null);

  // Fixed heights for header and footer in Edit Profile modal
  const EDIT_DRAG_HANDLE_HEIGHT = 15; // 3px bar + 8 marginTop + 2 marginBottom + 2 extra
  const EDIT_HEADER_HEIGHT = 54;
  const EDIT_FOOTER_HEIGHT = 66;

  // Compact modal height (bounded by safe area and screen height, up to 580px)
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const maxAvailableHeight = Math.min(
    screenHeight * 0.88,
    screenHeight - insets.top - Math.max(bottomInset, 16) - 24
  );
  const modalHeight = Math.min(580, maxAvailableHeight);
  // Explicit body height ensuring form is fully scrollable and bounded
  const bodyHeight = modalHeight - EDIT_DRAG_HANDLE_HEIGHT - EDIT_HEADER_HEIGHT - EDIT_FOOTER_HEIGHT;

  const resetFormToUser = (targetUser?: any) => {
    const u = targetUser !== undefined ? targetUser : user;
    if (u) {
      setFullName(u.fullName || '');
      setProgram(u.program || '');
      setSemester(u.semester !== undefined && u.semester !== null ? Number(u.semester) : 1);
      setBatch(u.batch || '');
      setType(u.type || 'Regular');
      setAvatarUri(u.avatarUri || null);
    } else {
      setFullName('');
      setProgram('');
      setSemester(1);
      setBatch('');
      setType('Regular');
      setAvatarUri(null);
    }
    setFeedback(null);
  };

  useEffect(() => {
    resetFormToUser(user);
  }, [user]);

  // Re-synchronize form with latest user profile every time modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      resetFormToUser(user);
    }
  }, [isEditModalOpen]);

  const handlePickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAvatarUri(file.uri);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to select image file.' });
    }
  };

  const handleOpenModal = () => {
    resetFormToUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    resetFormToUser(user);
    setIsEditModalOpen(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarUri(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setFeedback(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'Please specify your full name.' });
      setIsSaving(false);
      return;
    }

    // Student specific validations
    if (user && user.role !== 'teacher') {
      const normalizedInputBatch = normalizeBatch(batch);
      if (!normalizedInputBatch) {
        setFeedback({ type: 'error', message: 'Please specify your session / batch.' });
        setIsSaving(false);
        return;
      }

      if (!/^\d{4}-\d{4}$/.test(normalizedInputBatch)) {
        setFeedback({
          type: 'error',
          message: 'Batch must be in YYYY-YYYY format (e.g. 2024-2028).',
        });
        setIsSaving(false);
        return;
      }

      // Semester-change validation: Batch MUST be changed as well when Semester is changed
      const prevSem = Number(user.semester);
      const newSem = Number(semester);
      const prevBatch = normalizeBatch(user.batch);
      const newBatch = normalizedInputBatch;

      if (prevSem > 0 && newSem > 0 && newSem !== prevSem && newBatch === prevBatch) {
        setFeedback({
          type: 'error',
          message: 'Please change your batch/session as well when changing the semester.',
        });
        setIsSaving(false);
        return;
      }
    }

    try {
      const finalBatch = user?.role === 'teacher' ? batch.trim() : normalizeBatch(batch);
      await updateProfile({
        fullName: trimmedName,
        program: program.trim(),
        semester: Number(semester),
        batch: finalBatch,
        type,
        avatarUri: avatarUri || null,
      });
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CollapsibleHeader
        title="Profile & Settings"
        scrollY={scrollY}
      />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + 10, paddingBottom: tabBarHeight + 24 },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Subtitle */}
        <View style={styles.headerContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Account information & active academic configuration
          </Text>
        </View>

        {user ? (
          <>
            {/* User Profile Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0.2 : 0.05,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor: colors.badgeBg,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={handleOpenModal}
              >
                {user.avatarUri ? (
                  <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(user.fullName)}</Text>
                )}
                {/* Camera Badge Overlay */}
                <View style={[styles.avatarCameraBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={11} color="#ffffff" />
                </View>
              </Pressable>

              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {user.fullName || 'University Student'}
              </Text>
              <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {user.email}
              </Text>

              {/* Account Action Buttons Horizontal Row */}
              <View
                style={[
                  styles.profileActionRow,
                  {
                    backgroundColor: colors.badgeBg,
                    borderColor: colors.badgeBorder,
                  },
                ]}
              >
                {/* Left: Role Badge */}
                <View style={styles.profileActionLeft}>
                  <Ionicons
                    name={user.role === 'teacher' ? 'school-outline' : 'person-outline'}
                    size={14}
                    color={colors.primary}
                    style={styles.badgeIcon}
                  />
                  <Text style={[styles.roleBadgeText, { color: colors.primary }]} numberOfLines={1}>
                    {user.role === 'teacher' ? 'Faculty Member' : 'Student Account'}
                  </Text>
                </View>

                {/* Vertical Divider */}
                <View style={[styles.actionDivider, { backgroundColor: colors.badgeBorder }]} />

                {/* Right: Edit Profile Button */}
                <Pressable
                  style={styles.profileActionRight}
                  onPress={handleOpenModal}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={colors.primary}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.editProfileCardButtonText, { color: colors.primary }]} numberOfLines={1}>
                    Edit Profile
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Appearance / Theme Selector Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0.2 : 0.05,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>Appearance & Theme</Text>
                <Pressable onPress={toggleTheme} hitSlop={8}>
                  <Text style={[styles.editLinkText, { color: colors.primary }]}>
                    {isDark ? 'Switch to Light' : 'Switch to Dark'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.themeToggleRow}>
                <Pressable
                  style={[
                    styles.themeOptionButton,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                    isDark && {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Ionicons name="moon" size={16} color={isDark ? colors.primary : colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={[styles.themeOptionText, { color: isDark ? colors.textPrimary : colors.textSecondary }]}>
                    Dark Mode
                  </Text>
                  {isDark && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 6 }} />}
                </Pressable>

                <Pressable
                  style={[
                    styles.themeOptionButton,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                    !isDark && {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setThemeMode('light')}
                >
                  <Ionicons name="sunny" size={16} color={!isDark ? colors.gold : colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={[styles.themeOptionText, { color: !isDark ? colors.textPrimary : colors.textSecondary }]}>
                    Light Mode
                  </Text>
                  {!isDark && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 6 }} />}
                </Pressable>
              </View>
            </View>

            {/* Academic Details Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0.2 : 0.05,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>Academic Registration</Text>
                <Pressable onPress={handleOpenModal} hitSlop={8}>
                  <Text style={[styles.editLinkText, { color: colors.primary }]}>Edit</Text>
                </Pressable>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Degree Program</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {user.program || 'N/A'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Active Semester</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {user.semester ? `Semester ${user.semester}` : 'N/A'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Session / Batch</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {user.batch || 'N/A'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Section</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {user.type || 'Regular'}
                </Text>
              </View>
            </View>

            {/* App Info Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0.2 : 0.05,
                },
              ]}
            >
              <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>System Information</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Application</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  ShedUOS Mobile
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  Version 1.0.0
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Institution</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  University of Sargodha
                </Text>
              </View>
            </View>

            {/* Log Out CTA */}
            <Pressable
              style={[styles.logoutButton, { backgroundColor: colors.error }, isLoading && styles.buttonDisabled]}
              onPress={() => logout()}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.logoutContent}>
                  <Ionicons name="log-out-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </View>
              )}
            </Pressable>
          </>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>No user session active</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Edit Profile Modal with Compact Bottom-Sheet & Fixed Header/Footer Layout */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.5)',
              paddingTop: insets.top + 16,
              paddingBottom: Math.max(bottomInset, 16),
            },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdropPressable} onPress={handleCloseModal} />
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                height: modalHeight,
                maxHeight: maxAvailableHeight,
              },
            ]}
          >
            {/* Top Drag Handle */}
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />

            {/* 1. Fixed Modal Header */}
            <View style={[styles.modalHeader, { height: EDIT_HEADER_HEIGHT, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
              <Pressable onPress={handleCloseModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* 2. Middle Body with explicit bodyHeight — cannot collapse to 0 */}
            <View style={[styles.modalBodyContainer, { height: bodyHeight }]}>
              <ScrollView
                style={[styles.modalScrollBody, { height: bodyHeight }]}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
              {/* Feedback Banner */}
              {feedback ? (
                <View
                  style={[
                    styles.feedbackBox,
                    feedback.type === 'success'
                      ? { backgroundColor: colors.successBg, borderColor: colors.successBorder }
                      : { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
                  ]}
                >
                  <Ionicons
                    name={feedback.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={16}
                    color={feedback.type === 'success' ? colors.success : colors.error}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.feedbackText,
                      { color: feedback.type === 'success' ? colors.success : colors.error },
                    ]}
                  >
                    {feedback.message}
                  </Text>
                </View>
              ) : null}

              {/* Profile Photo Upload Section */}
              <View style={[styles.photoUploadSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={[styles.modalAvatarBox, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.modalAvatarImg} resizeMode="cover" />
                  ) : (
                    <Text style={[styles.modalAvatarInitials, { color: colors.primary }]}>
                      {getInitials(fullName || user?.fullName)}
                    </Text>
                  )}
                </View>

                <View style={styles.photoActionsCol}>
                  <Text style={[styles.photoSectionTitle, { color: colors.textPrimary }]}>Profile Picture</Text>
                  <View style={styles.photoBtnRow}>
                    <Pressable
                      style={[styles.uploadPhotoBtn, { backgroundColor: colors.primary }]}
                      onPress={handlePickAvatar}
                    >
                      <Ionicons name="camera-outline" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.uploadPhotoBtnText}>{avatarUri ? 'Change Photo' : 'Upload Photo'}</Text>
                    </Pressable>

                    {avatarUri ? (
                      <Pressable
                        style={[styles.removePhotoBtn, { borderColor: colors.border }]}
                        onPress={handleRemoveAvatar}
                      >
                        <Ionicons name="trash-outline" size={13} color={colors.error} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Notice Banner */}
              <View style={[styles.warningBox, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                  Updating your Active Semester, Session / Batch, or Section will automatically re-align your timetable schedule.
                </Text>
              </View>

              {/* Read-Only Email Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textMuted,
                    },
                    styles.disabledInput,
                  ]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>

              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {user?.role === 'teacher' ? 'Full Instructor Name' : 'Full Student Name'}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Degree Program Dropdown Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Degree Program</Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setActiveDropdown('program')}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {DEGREE_PROGRAMS.find((p) => p.value === program)?.label || program || 'Select Degree Program'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Active Semester Dropdown Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Active Semester</Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setActiveDropdown('semester')}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]}>Semester {semester}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Session / Batch Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Session / Batch</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={batch}
                  onChangeText={setBatch}
                  placeholder="2024-2028"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Section Dropdown Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Section</Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setActiveDropdown('section')}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]}>{type}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </ScrollView>
          </View>

            {/* 3. Fixed Footer with Cancel & Save Changes Buttons */}
            <View style={[styles.modalFooter, { height: EDIT_FOOTER_HEIGHT, borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.modalActionRow}>
                <Pressable
                  style={[
                    styles.cancelModalButton,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleCloseModal}
                >
                  <Text style={[styles.cancelModalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveModalButton,
                    { backgroundColor: colors.buttonGradientStart },
                    isSaving && styles.buttonDisabled,
                  ]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveModalButtonText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Degree Program Bottom Sheet (Searchable) */}
      <SelectBottomSheet
        visible={activeDropdown === 'program'}
        title="Select Degree Program"
        options={DEGREE_PROGRAMS}
        selectedValue={program}
        onSelect={(val) => setProgram(val)}
        onClose={() => setActiveDropdown(null)}
        searchable
      />

      {/* Semester Bottom Sheet Picker */}
      <Modal visible={activeDropdown === 'semester'} animationType="slide" transparent>
        <View
          style={[
            styles.pickerOverlay,
            {
              backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.45)',
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={() => setActiveDropdown(null)} />
          <View
            style={[
              styles.pickerSheetContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Select Active Semester</Text>
              <Pressable onPress={() => setActiveDropdown(null)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerOptionsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.pickerOptionsList}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.pickerOptionRow,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      semester === s && {
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setSemester(s);
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: colors.textSecondary },
                        semester === s && { color: colors.textPrimary, fontWeight: '700' },
                      ]}
                    >
                      Semester {s}
                    </Text>
                    {semester === s && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Section Bottom Sheet Picker */}
      <Modal visible={activeDropdown === 'section'} animationType="slide" transparent>
        <View
          style={[
            styles.pickerOverlay,
            {
              backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.45)',
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={() => setActiveDropdown(null)} />
          <View
            style={[
              styles.pickerSheetContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Select Section</Text>
              <Pressable onPress={() => setActiveDropdown(null)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerOptionsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.pickerOptionsList}>
                {['Regular', 'Self Support 1', 'Self Support 2'].map((sec) => (
                  <Pressable
                    key={sec}
                    style={[
                      styles.pickerOptionRow,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      (type === sec) && {
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setType(sec);
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: colors.textSecondary },
                        (type === sec) && {
                          color: colors.textPrimary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {sec}
                    </Text>
                    {(type === sec) && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    lineHeight: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: Typography.weights.bold,
  },
  name: {
    fontSize: 16,
    fontWeight: Typography.weights.bold,
    marginBottom: 1,
  },
  email: {
    fontSize: Typography.sizes.xs,
    marginBottom: 5,
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    width: '100%',
    height: 32,
    marginTop: 3,
    overflow: 'hidden',
  },
  profileActionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    height: '100%',
  },
  actionDivider: {
    width: 1,
    height: 14,
  },
  profileActionRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    height: '100%',
  },
  badgeIcon: {
    marginRight: 5,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
  },
  editProfileCardButtonText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  themeToggleRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    marginTop: 2,
  },
  themeOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  cardHeaderTitle: {
    fontSize: 13.5,
    fontWeight: Typography.weights.bold,
  },
  editLinkText: {
    fontSize: 11.5,
    fontWeight: Typography.weights.bold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 5,
  },
  logoutButton: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  modalDragHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalBodyContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  modalScrollBody: {
    width: '100%',
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 56,
    flexGrow: 1,
  },
  modalFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  photoUploadSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
  },
  modalAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalAvatarImg: {
    width: '100%',
    height: '100%',
  },
  modalAvatarInitials: {
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  photoActionsCol: {
    flex: 1,
  },
  photoSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  photoBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  uploadPhotoBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  removePhotoBtn: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 7,
    marginBottom: 6,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 7,
    marginBottom: 6,
  },
  warningText: {
    fontSize: 10.5,
    lineHeight: 14.5,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    marginBottom: 3,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 38,
    fontSize: Typography.sizes.sm,
  },
  disabledInput: {
    opacity: 0.6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  dropdownTriggerText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelModalButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelModalButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  saveModalButton: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  saveModalButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  pickerSheetContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  pickerOptionsScroll: {
    flexGrow: 0,
  },
  pickerOptionsList: {
    gap: 5,
  },
  pickerOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: Typography.weights.medium,
  },
});
