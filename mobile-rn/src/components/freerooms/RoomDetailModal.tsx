import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RoomStatus } from '../../utils/freeRoomUtils';
import { format12HourTime } from '../../utils/timeUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface RoomDetailModalProps {
  visible: boolean;
  item: RoomStatus | null;
  onClose: () => void;
}

export default function RoomDetailModal({ visible, item, onClose }: RoomDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  if (!item) return null;

  const isPharmacy = item.room.toLowerCase().includes('pharmacy') || item.room.toLowerCase().includes('phar');

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.categoryBadge,
                  item.category === 'Labs'
                    ? { backgroundColor: colors.purpleBg }
                    : { backgroundColor: colors.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: item.category === 'Labs' ? colors.purple : colors.primary },
                  ]}
                >
                  {item.category === 'Labs' ? 'Laboratory / Lab' : 'Lecture Classroom'}
                </Text>
              </View>
              {isPharmacy && (
                <View style={[styles.pharmacyBadge, { backgroundColor: colors.warningBg }]}>
                  <Text style={[styles.pharmacyText, { color: colors.warning }]}>Pharmacy Dept</Text>
                </View>
              )}
            </View>

            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
              <Text style={[styles.closeButtonText, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          {/* Room Name */}
          <Text style={[styles.roomTitle, { color: colors.textPrimary }]}>{item.room}</Text>

          {/* Current Status Pill Banner */}
          <View
            style={[
              styles.statusBanner,
              item.isFree
                ? { backgroundColor: colors.successBg, borderColor: colors.successBorder }
                : { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
            ]}
          >
            <View style={styles.statusBannerRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: item.isFree ? colors.success : colors.error },
                ]}
              />
              <Text
                style={[
                  styles.statusBannerText,
                  { color: item.isFree ? colors.success : colors.error },
                ]}
              >
                {item.isFree
                  ? item.nextClass
                    ? `Free right now — Next lecture at ${format12HourTime(item.nextClass.startTime)}`
                    : 'Free right now — No further lectures today'
                  : `Occupied until ${format12HourTime(item.activeClass?.endTime || '')}`}
              </Text>
            </View>

            {!item.isFree && item.activeClass && (
              <View style={styles.activeDetailsBox}>
                <Text style={[styles.activeCourseName, { color: colors.textPrimary }]}>
                  {item.activeClass.name}
                </Text>
                <Text style={[styles.activeMetaText, { color: colors.textSecondary }]}>
                  Instructor: {item.activeClass.teacher || 'Faculty'}
                </Text>
                <Text style={[styles.activeMetaText, { color: colors.textSecondary }]}>
                  Batch: {item.activeClass.batch || 'General'} • Sem {item.activeClass.semester || '1'} ({item.activeClass.type || 'Regular'})
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Chronological Day Schedule */}
          <Text style={[styles.scheduleSectionTitle, { color: colors.textPrimary }]}>
            Today's Schedule ({item.schedule.length} {item.schedule.length === 1 ? 'class' : 'classes'})
          </Text>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {item.schedule.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.textMuted} style={{ marginBottom: 4 }} />
                <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
                  No lectures scheduled for this room today. Entire day is free.
                </Text>
              </View>
            ) : (
              item.schedule.map((cls, idx) => (
                <View
                  key={`${cls.code}_${cls.startTime}_${idx}`}
                  style={[
                    styles.scheduleItemCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.scheduleItemTop}>
                    <Text style={[styles.scheduleItemTime, { color: colors.primary }]}>
                      {format12HourTime(cls.startTime)} - {format12HourTime(cls.endTime)}
                    </Text>
                    <Text style={[styles.scheduleItemSection, { color: colors.textMuted }]}>
                      {cls.type || 'Regular'} (Sem {cls.semester || 1})
                    </Text>
                  </View>
                  <Text style={[styles.scheduleItemName, { color: colors.textPrimary }]}>
                    {cls.name}
                  </Text>
                  <Text style={[styles.scheduleItemTeacher, { color: colors.textSecondary }]}>
                    Instructor: {cls.teacher || 'To be allocated'}
                  </Text>
                </View>
              ))
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pharmacyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pharmacyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  statusBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  activeDetailsBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  activeCourseName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeMetaText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  separator: {
    height: 1,
    marginBottom: 10,
  },
  scheduleSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  scrollBody: {
    maxHeight: 280,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  emptyBoxText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scheduleItemCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  scheduleItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  scheduleItemTime: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  scheduleItemSection: {
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleItemName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  scheduleItemTeacher: {
    fontSize: 11,
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
