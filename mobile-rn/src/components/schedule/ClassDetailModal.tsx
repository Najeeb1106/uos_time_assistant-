import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClassLecture } from '../../models/Schedule';
import { format12HourTime } from '../../utils/timeUtils';
import { getClassSectionDisplay } from '../../utils/sectionUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface ClassDetailModalProps {
  visible: boolean;
  item: ClassLecture | null;
  onClose: () => void;
}

export default function ClassDetailModal({ visible, item, onClose }: ClassDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.45)',
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0.3 : 0.1,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.codeText, { color: colors.primary }]}>{item.code || 'COURSE CODE'}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
              <Text style={[styles.closeButtonText, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          <Text style={[styles.titleText, { color: colors.textPrimary }]}>{item.name}</Text>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Time Slot:</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {format12HourTime(item.startTime)} - {format12HourTime(item.endTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Day:</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>{item.day}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room / Location:</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>{item.room || 'TBA'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Instructor:</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>{item.teacher || 'Faculty Member'}</Text>
            </View>

            {item.program ? (
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Program:</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{item.program}</Text>
              </View>
            ) : null}

            {item.semester ? (
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Semester & Batch:</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  Semester {item.semester} • {item.batch || '2024-2028'}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Section:</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>{getClassSectionDisplay(item)}</Text>
            </View>
          </ScrollView>

          <Pressable
            style={[styles.dismissButton, { backgroundColor: colors.buttonGradientStart }]}
            onPress={onClose}
          >
            <Text style={styles.dismissButtonText}>Close Details</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  scrollBody: {
    maxHeight: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  titleText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    lineHeight: 22,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  label: {
    fontSize: Typography.sizes.sm,
    marginRight: 12,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    flexShrink: 1,
    textAlign: 'right',
  },
  dismissButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
