import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  useWindowDimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMobileStore } from '../../stores/useMobileStore';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import SelectBottomSheet from '../../components/common/SelectBottomSheet';
import { DEGREE_PROGRAMS } from '../../constants/degreePrograms';
import { normalizeBatch } from '../../utils/builtinScheduleUtils';

export default function ProfileScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const modalHeight = Math.min(screenHeight * 0.85, screenHeight - 80);
  const { user, updateProfile, logout } = useMobileStore();
  const { classes } = useScheduleStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isProgramPickerOpen, setIsProgramPickerOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [program, setProgram] = useState(user?.program || '');
  const [type, setType] = useState<string>(user?.type || 'Regular');
  const [batch, setBatch] = useState(user?.batch || '');
  const [semester, setSemester] = useState(user?.semester !== undefined && user?.semester !== null ? String(user.semester) : '1');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUri || null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetFormToUser = (targetUser?: any) => {
    const u = targetUser !== undefined ? targetUser : user;
    if (u) {
      setFullName(u.fullName || '');
      setProgram(u.program || '');
      setType(u.type || 'Regular');
      setBatch(u.batch || '');
      setSemester(u.semester !== undefined && u.semester !== null ? String(u.semester) : '1');
      setAvatarUri(u.avatarUri || null);
    } else {
      setFullName('');
      setProgram('');
      setType('Regular');
      setBatch('');
      setSemester('1');
      setAvatarUri(null);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  useEffect(() => {
    resetFormToUser(user);
  }, [user]);

  // Re-synchronize form with latest user profile every time modal opens
  useEffect(() => {
    if (isEditing) {
      resetFormToUser(user);
    }
  }, [isEditing]);

  const handleOpenModal = () => {
    resetFormToUser(user);
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    resetFormToUser(user);
    setIsEditing(false);
  };

  const handlePickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      setErrorMsg('Failed to select image file.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUri(null);
  };

  // Timetable alignment warning detection
  const isParamChanged =
    user &&
    user.role !== 'teacher' &&
    (semester !== String(user.semester) || batch !== user.batch || type !== user.type);

  const getInitials = (name?: string) => {
    if (!name) return user?.role === 'teacher' ? 'TR' : 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSaveProfile = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMsg('Please specify your full name.');
      return;
    }

    if (user?.role !== 'teacher') {
      const normalizedInputBatch = normalizeBatch(batch);
      if (!normalizedInputBatch) {
        setErrorMsg('Please specify your session / batch.');
        return;
      }
      if (!/^\d{4}-\d{4}$/.test(normalizedInputBatch)) {
        setErrorMsg('Batch must be in YYYY-YYYY format (e.g. 2024-2028).');
        return;
      }

      // Semester-change validation: Batch MUST be changed as well when Semester is changed
      const prevSem = Number(user?.semester);
      const newSem = Number(semester);
      const prevBatch = normalizeBatch(user?.batch);
      const newBatch = normalizedInputBatch;

      if (prevSem > 0 && newSem > 0 && newSem !== prevSem && newBatch === prevBatch) {
        setErrorMsg('Please change your batch/session as well when changing the semester.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const finalBatch = user?.role === 'teacher' ? batch.trim() : normalizeBatch(batch);
      const payload: any = {
        fullName: trimmedName,
        avatarUri: avatarUri || null,
      };

      if (user?.role !== 'teacher') {
        payload.program = program.trim();
        payload.type = type;
        payload.batch = finalBatch;
        payload.semester = Number(semester);
      }

      await updateProfile(payload);
      setSuccessMsg('Academic profile updated successfully!');
      handleCloseModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of ShedUOS?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 20 }]}
    >
      {/* Header Profile Summary */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
          )}
        </View>

        <Text style={styles.userName}>{user?.fullName || 'User Profile'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'student@uos.edu.pk'}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'teacher' ? '👨‍🏫 Faculty Instructor' : '🎓 Student Account'}
          </Text>
        </View>
      </View>

      {/* Success Banner */}
      {successMsg ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>✅ {successMsg}</Text>
        </View>
      ) : null}

      {/* Academic Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Academic Information</Text>
          <Pressable style={styles.editButton} onPress={handleOpenModal}>
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Program</Text>
            <Text style={styles.infoValue}>{user?.program || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Semester</Text>
            <Text style={styles.infoValue}>Semester {user?.semester || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Batch / Session</Text>
            <Text style={styles.infoValue}>{user?.batch || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Support Type</Text>
            <Text style={styles.infoValue}>{user?.type || 'Regular'}</Text>
          </View>
        </View>
      </View>

      {/* Timetable Alignment Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timetable Filter Status</Text>
        <Text style={styles.alignmentSub}>
          Your saved timetable automatically matches classes for Semester {user?.semester} {user?.type} ({user?.batch}).
        </Text>
        <View style={styles.alignmentBadgeRow}>
          <Text style={styles.alignmentBadgeText}>
            Classes saved: <Text style={styles.boldText}>{classes.length} lectures</Text>
          </Text>
        </View>
      </View>

      {/* Logout Action Card */}
      {user ? (
        <Pressable style={styles.logoutCard} onPress={handleLogoutPress}>
          <Text style={styles.logoutText}>🚪 Logout of Account</Text>
        </Pressable>
      ) : null}

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <View
          style={[
            styles.modalOverlay,
            {
              paddingTop: 44,
              paddingBottom: tabBarHeight + 10,
            },
          ]}
        >
          <View style={[styles.modalContainer, { height: modalHeight }]}>
            {/* Fixed Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Academic Profile</Text>
              <Pressable onPress={handleCloseModal} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Photo Upload Section */}
              <View style={styles.photoUploadRow}>
                <View style={styles.photoPreviewCircle}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.photoPreviewInitials}>{getInitials(fullName || user?.fullName)}</Text>
                  )}
                </View>
                <View style={styles.photoUploadControls}>
                  <Text style={styles.photoSectionTitle}>Profile Picture</Text>
                  <View style={styles.photoButtonsRow}>
                    <Pressable style={styles.photoUploadBtn} onPress={handlePickAvatar}>
                      <Text style={styles.photoUploadBtnText}>{avatarUri ? 'Change Photo' : 'Upload Photo'}</Text>
                    </Pressable>
                    {avatarUri ? (
                      <Pressable style={styles.photoRemoveBtn} onPress={handleRemoveAvatar}>
                        <Text style={styles.photoRemoveBtnText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>

              {isParamChanged ? (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningBannerText}>
                    ⚠️ Note: Changing your active semester or batch will require re-uploading your timetable PDF to extract matching classes for your new profile.
                  </Text>
                </View>
              ) : null}

              {/* Form Input Fields */}
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Email (Read-only)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                editable={false}
              />

              {user?.role !== 'teacher' ? (
                <>
                  <Text style={styles.inputLabel}>Degree Program</Text>
                  <Pressable
                    style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => setIsProgramPickerOpen(true)}
                  >
                    <Text style={{ color: Colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                      {DEGREE_PROGRAMS.find((p) => p.value === program)?.label || program || 'Select Degree Program'}
                    </Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>▼</Text>
                  </Pressable>

                  <Text style={styles.inputLabel}>Semester (1 - 8)</Text>
                  <View style={styles.semBox}>
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map((sem) => (
                      <Pressable
                        key={sem}
                        style={[styles.semChip, semester === sem && styles.semChipActive]}
                        onPress={() => setSemester(sem)}
                      >
                        <Text style={[styles.semChipText, semester === sem && styles.semChipTextActive]}>
                          Sem {sem}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Batch (Format: YYYY-YYYY)</Text>
                  <TextInput
                    style={styles.input}
                    value={batch}
                    onChangeText={setBatch}
                    placeholder="e.g. 2024-2028"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.inputLabel}>Section</Text>
                  <View style={styles.typeRow}>
                    {(['Regular', 'Self Support 1', 'Self Support 2'] as const).map((t) => (
                      <Pressable
                        key={t}
                        style={[styles.typeChip, type === t && styles.typeChipActive]}
                        onPress={() => setType(t)}
                      >
                        <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>

            {/* Fixed Footer Actions */}
            <View style={styles.modalFooter}>
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsEditing(false);
                    setErrorMsg(null);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.saveBtn} onPress={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Degree Program Bottom Sheet Picker */}
      <SelectBottomSheet
        visible={isProgramPickerOpen}
        title="Select Degree Program"
        options={DEGREE_PROGRAMS}
        selectedValue={program}
        onSelect={(val) => setProgram(val)}
        onClose={() => setIsProgramPickerOpen(false)}
        searchable
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: Typography.weights.bold,
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  photoPreviewCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreviewInitials: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: Typography.weights.bold,
  },
  photoUploadControls: {
    flex: 1,
  },
  photoSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    marginBottom: 6,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoUploadBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoUploadBtnText: {
    color: '#ffffff',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  photoRemoveBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoRemoveBtnText: {
    color: Colors.error,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: Colors.primary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: Colors.success,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  editButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  alignmentSub: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 18,
  },
  alignmentBadgeRow: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 10,
    borderRadius: 10,
  },
  alignmentBadgeText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  boldText: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  logoutCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    maxHeight: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseText: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: Colors.cardBackground,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: Typography.sizes.xs,
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningBannerText: {
    color: Colors.warning,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  pickerBox: {
    gap: 6,
  },
  optionChip: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  optionChipTextActive: {
    color: '#ffffff',
    fontWeight: Typography.weights.bold,
  },
  semBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  semChip: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  semChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  semChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  semChipTextActive: {
    color: '#ffffff',
    fontWeight: Typography.weights.bold,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  typeChipTextActive: {
    color: '#ffffff',
    fontWeight: Typography.weights.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
