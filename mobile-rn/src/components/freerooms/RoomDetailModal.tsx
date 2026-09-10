import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RoomStatus } from '../../utils/freeRoomUtils';
import { format12HourTime } from '../../utils/timeUtils';
import { getClassSectionDisplay } from '../../utils/sectionUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface RoomDetailModalProps {
  visible: boolean;
  item: RoomStatus | null;
  onClose: () => void;
}

export default function RoomDetailModal({ visible, item, onClose }: RoomDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  if (!item) return null;

  const isPharmacy = item.room.toLowerCase().includes('pharmacy') || item.room.toLowerCase().includes('phar');

  // Heights of fixed structural elements
  const HEADER_HEIGHT = 52;
  const FOOTER_HEIGHT = 68;

  // Maximum allowed height: 88% of screen height and strictly under safe-area insets
  const maxAvailableHeight = Math.min(
    screenHeight * 0.88,
    screenHeight - insets.top - Math.max(insets.bottom, 16) - 32
  );

  // Dynamic content height estimation:
  // Room title + status banner: ~120px for free, ~195px for occupied
  // Today's schedule heading + separator: ~38px
  // Schedule list: ~95px for empty state, ~84px per class card
  // Bottom padding: 48px to cleanly clear the fixed footer
  const roomInfoHeight = item.isFree ? 120 : 195;
  const scheduleListHeight = item.schedule.length === 0 ? 95 : item.schedule.length * 84;
  const estimatedScrollContentHeight = roomInfoHeight + scheduleListHeight + 48;

  // Desired modal height = fixed header + scroll content + fixed footer
  const desiredModalHeight = HEADER_HEIGHT + estimatedScrollContentHeight + FOOTER_HEIGHT;

  // Modal height dynamically sizes to content for few classes, caps at maxAvailableHeight for many classes
  const modalHeight = Math.min(Math.round(desiredModalHeight), Math.round(maxAvailableHeight));

  // Explicit, rock-solid body height: cannot collapse or shrink to 0
  const bodyHeight = modalHeight - HEADER_HEIGHT - FOOTER_HEIGHT;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.45)',
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Backdrop pressable outside modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Container: Rock-solid View with explicit modalHeight */}
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0.3 : 0.1,
              height: modalHeight,
              maxHeight: maxAvailableHeight,
            },
          ]}
        >
          {/* 1. Fixed Header with exact height */}
          <View style={[styles.header, { height: HEADER_HEIGHT, borderBottomColor: colors.border }]}>
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
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* 2. Middle Body with explicit bodyHeight */}
          <View style={[styles.bodyContainer, { height: bodyHeight }]}>
            <ScrollView
              style={[styles.scrollBody, { height: bodyHeight }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Room Name */}
              <Text style={[styles.roomTitle, { color: colors.textPrimary }]}>
                {item.room}
              </Text>

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
                      Batch: {item.activeClass.batch || 'General'} • Sem {item.activeClass.semester || '1'} ({getClassSectionDisplay(item.activeClass)})
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              {/* Chronological Day Schedule */}
              <Text style={[styles.scheduleSectionTitle, { color: colors.textPrimary }]}>
                Today's Schedule ({item.schedule.length} {item.schedule.length === 1 ? 'class' : 'classes'})
              </Text>

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
                        {getClassSectionDisplay(cls)} (Sem {cls.semester || 1})
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
          </View>

          {/* 3. Fixed Footer with exact height */}
          <View style={[styles.footer, { height: FOOTER_HEIGHT, borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <Pressable
              style={[styles.dismissButton, { backgroundColor: colors.buttonGradientStart }]}
              onPress={onClose}
            >
              <Text style={styles.dismissButtonText}>Close Details</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pharmacyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  pharmacyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  bodyContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  scrollBody: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    flexGrow: 1,
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 10,
    marginBottom: 10,
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
    fontSize: 12,
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
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeMetaText: {
    fontSize: 11,
    lineHeight: 15,
  },
  separator: {
    height: 1,
    marginBottom: 8,
  },
  scheduleSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  emptyBoxText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scheduleItemCard: {
    borderWidth: 1,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 10,
    marginBottom: 8,
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
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  scheduleItemTeacher: {
    fontSize: 11,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  dismissButton: {
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
