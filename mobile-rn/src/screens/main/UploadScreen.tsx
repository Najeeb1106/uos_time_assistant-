import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { MainTabNavigationProp } from '../../navigation/types';
import { uploadScheduleApi, saveScheduleApi } from '../../api/scheduleUploadApi';
import { ClassLecture } from '../../models/Schedule';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { saveScheduleCache } from '../../utils/scheduleCache';
import { format12HourTime, getTodayDayName } from '../../utils/timeUtils';
import { getClassSectionDisplay } from '../../utils/sectionUtils';
import { parseLocation } from '../../utils/locationUtils';
import CollapsibleHeader, { TOOLBAR_HEIGHT } from '../../components/common/CollapsibleHeader';
import AppLoader from '../../components/ui/AppLoader';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function UploadScreen() {
  const navigation = useNavigation<MainTabNavigationProp<'UploadTab'>>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, isDark } = useTheme();
  const headerTotalHeight = TOOLBAR_HEIGHT + insets.top;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [step, setStep] = useState<'idle' | 'uploading' | 'preview' | 'saving' | 'success'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [parsedClasses, setParsedClasses] = useState<ClassLecture[]>([]);
  const [isScanned, setIsScanned] = useState(false);
  const [previewDay, setPreviewDay] = useState<string>(getTodayDayName());

  // Document Picker Handler
  const handlePickDocument = async () => {
    setErrorMessage('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setStep('idle');
        setParsedClasses([]);
      }
    } catch {
      setErrorMessage('Could not open document picker. Please try again.');
    }
  };

  // Upload and Parse PDF
  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setErrorMessage('');
    setStep('uploading');
    setStatusMessage('Uploading and parsing timetable PDF...');

    try {
      const response = await uploadScheduleApi(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType || 'application/pdf'
      );

      if (!response.success || !response.classes || response.classes.length === 0) {
        const fallbackMsg = (response.message && !response.message.includes('Parsed 0')) ? response.message : 'No scheduled classes found for your profile in this timetable.';
        throw new Error(fallbackMsg);
      }

      setParsedClasses(response.classes);
      setIsScanned(!!response.isScannedFallback);
      setStep('preview');
      setStatusMessage('');
    } catch (err: any) {
      setStep('idle');
      let msg = 'An error occurred while uploading and parsing the PDF.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      if (msg && (msg.includes('Parsed 0 matching schedule lectures') || msg.includes('No matching lectures found'))) {
        msg = 'No scheduled classes found for your profile in this timetable.';
      }
      setErrorMessage(msg);
    }
  };

  // Confirm & Save Schedule
  const handleSaveSchedule = async () => {
    if (parsedClasses.length === 0 || !selectedFile) return;

    setErrorMessage('');
    setStep('saving');
    setStatusMessage('Saving timetable to your account...');

    try {
      const response = await saveScheduleApi(parsedClasses, selectedFile.name);

      if (!response.success) {
        throw new Error(response.message || 'Failed to save timetable.');
      }

      const scheduleData = response.schedule || {
        uid: '',
        classes: parsedClasses,
        pdfFileName: selectedFile.name,
        uploadedAt: new Date().toISOString(),
      };

      // Update Zustand schedule store directly
      useScheduleStore.setState({
        classes: scheduleData.classes,
        pdfFileName: scheduleData.pdfFileName,
        uploadedAt: scheduleData.uploadedAt,
        isLoading: false,
        isOffline: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });

      // Save to AsyncStorage cache
      await saveScheduleCache({
        classes: scheduleData.classes,
        pdfFileName: scheduleData.pdfFileName,
        uploadedAt: scheduleData.uploadedAt,
      });

      setStep('success');
      setSuccessNotice('Schedule saved successfully to your account!');

      // Navigate to Dashboard after brief delay
      setTimeout(() => {
        navigation.navigate('DashboardTab');
      }, 1200);
    } catch (err: any) {
      setStep('preview');
      let msg = 'Failed to save schedule.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
    }
  };

  // Filter parsed preview entries by selected day
  const previewClassesForDay = parsedClasses
    .filter((c) => c.day === previewDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CollapsibleHeader
        title="Upload Timetable"
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
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Upload your department timetable PDF to import your schedule.
          </Text>
        </View>

        {errorMessage ? (
          <View style={[styles.errorCard, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {successNotice ? (
          <View style={[styles.successCard, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
            <Text style={[styles.successText, { color: colors.success }]}>{successNotice}</Text>
          </View>
        ) : null}

        {isScanned && step === 'preview' ? (
          <View style={[styles.warningCard, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
            <Text style={[styles.warningText, { color: colors.warning }]}>
              ℹ️ Scanned PDF Notice: Preloaded authentic timetable entries for your program.
            </Text>
          </View>
        ) : null}

        {/* Step 1: File Selection Container */}
        {step === 'idle' || step === 'uploading' ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>PDF Document Picker</Text>

            <Pressable
              style={[
                styles.pickerBox,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
              onPress={handlePickDocument}
              disabled={step === 'uploading'}
            >
              <Text style={styles.pickerIcon}>📄</Text>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                {selectedFile ? selectedFile.name : 'Tap to select Timetable PDF'}
              </Text>
              <Text style={[styles.pickerSub, { color: colors.textMuted }]}>Only official PDF files supported</Text>
            </Pressable>

            {selectedFile ? (
              <View style={[styles.fileSelectedBar, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.selectedFileName, { color: colors.primary }]} numberOfLines={1}>
                  Selected: {selectedFile.name}
                </Text>
                <Pressable
                  onPress={() => setSelectedFile(null)}
                  disabled={step === 'uploading'}
                >
                  <Text style={[styles.removeText, { color: colors.error }]}>Change</Text>
                </Pressable>
              </View>
            ) : null}

            {step === 'uploading' ? (
              <AppLoader
                size="small"
                message={statusMessage || 'Uploading & parsing timetable...'}
                subtitle="Extracting academic schedules"
                style={{ paddingVertical: 12 }}
              />
            ) : (
              <Pressable
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.buttonGradientStart },
                  !selectedFile && { backgroundColor: colors.surfaceElevated, opacity: 0.6 },
                ]}
                onPress={handleUploadAndParse}
                disabled={!selectedFile}
              >
                <Text style={styles.actionButtonText}>Upload & Parse Timetable</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* Step 2: Parsed Preview Container */}
        {(step === 'preview' || step === 'saving' || step === 'success') && parsedClasses.length > 0 ? (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Parsed Schedule Preview</Text>
                <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                  {parsedClasses.length} matching lectures extracted from PDF
                </Text>
              </View>
              <Pressable
                style={[
                  styles.replaceButton,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => {
                  setStep('idle');
                  setSelectedFile(null);
                  setParsedClasses([]);
                }}
                disabled={step === 'saving'}
              >
                <Text style={[styles.replaceButtonText, { color: colors.textSecondary }]}>Replace PDF</Text>
              </Pressable>
            </View>

            {/* Day Selector Bar for Preview */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
              {DAYS.map((day) => {
                const dayCount = parsedClasses.filter((c) => c.day === day).length;
                const isSelected = previewDay === day;
                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      isSelected && {
                        backgroundColor: colors.buttonGradientStart,
                        borderColor: colors.buttonGradientStart,
                      },
                    ]}
                    onPress={() => setPreviewDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        { color: colors.textSecondary },
                        isSelected && styles.activeDayChipText,
                      ]}
                    >
                      {day.substring(0, 3)} ({dayCount})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Class Cards List */}
            {previewClassesForDay.length === 0 ? (
              <View style={[styles.noClassesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.noClassesText, { color: colors.textSecondary }]}>
                  No lectures for {previewDay} in parsed PDF
                </Text>
              </View>
            ) : (
              previewClassesForDay.map((cls, idx) => {
                const loc = parseLocation(cls.room);
                return (
                  <View
                    key={cls.classId || idx}
                    style={[
                      styles.previewClassCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.previewCardHeader}>
                      <Text style={[styles.previewClassCode, { color: colors.primary }]}>{cls.code}</Text>
                      <Text style={[styles.previewClassTime, { color: colors.textSecondary }]}>
                        {format12HourTime(cls.startTime)} - {format12HourTime(cls.endTime)}
                      </Text>
                    </View>
                    <Text style={[styles.previewClassName, { color: colors.textPrimary }]}>{cls.name}</Text>
                    <View style={styles.previewLocationRow}>
                      <Text style={styles.previewMetaIcon}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.previewDeptText, { color: colors.textSecondary }]}>
                          {loc.department}
                        </Text>
                        {loc.roomNumber ? (
                          <Text style={[styles.previewRoomText, { color: colors.primary }]}>
                            {loc.roomNumber}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.previewMetaRow}>
                      <Text style={[styles.previewClassMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        👨‍🏫 {cls.teacher || 'To be allocated'}
                      </Text>
                      {getClassSectionDisplay(cls) ? (
                        <Text style={[styles.previewTag, { backgroundColor: colors.surfaceElevated, color: colors.textMuted }]}>
                          {getClassSectionDisplay(cls)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}

            {/* Final Save Confirm Button */}
            {step === 'saving' ? (
              <AppLoader
                size="small"
                message={statusMessage || 'Saving schedule to your profile...'}
                subtitle="Applying timetable configuration"
                style={{ paddingVertical: 12 }}
              />
            ) : step === 'success' ? (
              <View style={[styles.successBox, { backgroundColor: colors.successBg }]}>
                <Text style={[styles.successBoxText, { color: colors.success }]}>✓ Schedule Saved Successfully</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.saveButton, { backgroundColor: colors.success }]}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.saveButtonText}>Confirm & Apply This Schedule</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerContainer: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    lineHeight: 16,
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
  },
  successCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  warningCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  warningText: {
    fontSize: Typography.sizes.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 10,
  },
  pickerBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickerIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  pickerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    marginBottom: 2,
  },
  pickerSub: {
    fontSize: Typography.sizes.xs,
  },
  fileSelectedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  selectedFileName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    flex: 1,
    marginRight: 10,
  },
  removeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  previewContainer: {
    marginTop: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  previewSubtitle: {
    fontSize: Typography.sizes.xs,
  },
  replaceButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replaceButtonText: {
    fontSize: Typography.sizes.xs,
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  dayChip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: Typography.sizes.xs,
  },
  activeDayChipText: {
    color: '#ffffff',
    fontWeight: Typography.weights.bold,
  },
  noClassesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  noClassesText: {
    fontSize: Typography.sizes.sm,
  },
  previewClassCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewClassCode: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  previewClassTime: {
    fontSize: Typography.sizes.xs,
  },
  previewClassName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 6,
  },
  previewLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  previewMetaIcon: {
    fontSize: Typography.sizes.xs,
    marginRight: 4,
    marginTop: 1,
  },
  previewDeptText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
    lineHeight: 16,
  },
  previewRoomText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 1,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  previewClassMeta: {
    fontSize: Typography.sizes.xs,
    flexShrink: 1,
  },
  previewTag: {
    fontSize: 9,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  successBox: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  successBoxText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
