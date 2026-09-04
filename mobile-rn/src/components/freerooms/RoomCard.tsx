import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomStatus } from '../../utils/freeRoomUtils';
import { format12HourTime } from '../../utils/timeUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface RoomCardProps {
  item: RoomStatus;
}

export default function RoomCard({ item }: RoomCardProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const isPharmacy = item.room.toLowerCase().includes('pharmacy') || item.room.toLowerCase().includes('phar');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0.2 : 0.05,
        },
        item.isFree
          ? [styles.freeCard, { borderLeftColor: colors.success }]
          : [styles.occupiedCard, { borderLeftColor: colors.error }],
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.categoryBadge,
                item.category === 'Labs'
                  ? { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.08)' }
                  : { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  item.category === 'Labs'
                    ? { color: colors.secondary }
                    : { color: colors.primary },
                ]}
              >
                {item.category === 'Labs' ? 'Laboratory / Lab' : 'Lecture Classroom'}
              </Text>
            </View>
            {isPharmacy && (
              <View style={[styles.pharmacyBadge, { backgroundColor: colors.warningBg }]}>
                <Text style={[styles.pharmacyText, { color: colors.warning }]}>🏫 Pharmacy Dept Building</Text>
              </View>
            )}
          </View>

          <Text style={[styles.roomName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.room}
          </Text>
        </View>

        {/* Status Pill Badge */}
        <View
          style={[
            styles.statusBadge,
            item.isFree
              ? { backgroundColor: colors.successBg, borderColor: colors.successBorder }
              : { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isFree ? colors.success : colors.error },
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: item.isFree ? colors.success : colors.error },
            ]}
          >
            {item.isFree ? 'FREE NOW' : 'OCCUPIED'}
          </Text>
        </View>
      </View>

      {/* Main Status Information Banner */}
      {item.isFree ? (
        <View style={styles.freeContainer}>
          <View
            style={[
              styles.freeInfoBanner,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(5, 150, 105, 0.06)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.18)',
              },
            ]}
          >
            <Text style={[styles.freeHeaderStatusText, { color: colors.success }]}>
              🟢 {item.nextClass
                ? `Free until ${format12HourTime(item.nextClass.startTime)}`
                : 'Free for remainder of day'}
            </Text>

            {item.nextClass ? (
              <View style={[styles.nextScheduleBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.nextScheduleTitle, { color: colors.textPrimary }]}>
                  Next scheduled occupancy:
                </Text>
                <Text style={[styles.nextScheduleTime, { color: colors.primary }]}>
                  🕒 {format12HourTime(item.nextClass.startTime)} - {format12HourTime(item.nextClass.endTime)}
                </Text>
                <Text style={[styles.nextScheduleDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.nextClass.name} ({item.nextClass.teacher})
                </Text>
              </View>
            ) : (
              <View style={[styles.noFurtherClassesBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(5, 150, 105, 0.05)', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.2)' }]}>
                <Text style={[styles.noFurtherClassesText, { color: colors.success }]}>
                  ✓ No further lectures scheduled for today!
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.occupiedInfoBanner,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.06)' : 'rgba(220, 38, 38, 0.06)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(220, 38, 38, 0.18)',
            },
          ]}
        >
          <View style={styles.occupiedTopRow}>
            <Text style={[styles.activeLectureBadgeText, { color: colors.error }]}>
              🕒 ACTIVE LECTURE
            </Text>
            <Text style={[styles.occupiedTimeRange, { color: colors.error }]}>
              {format12HourTime(item.activeClass?.startTime || '')} - {format12HourTime(item.activeClass?.endTime || '')}
            </Text>
          </View>

          <Text style={[styles.activeCourseText, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.activeClass?.name}
          </Text>

          <View style={styles.occupiedMetaCol}>
            <Text style={[styles.activeTeacherText, { color: colors.textSecondary }]}>
              📍 Instructor: {item.activeClass?.teacher || 'Faculty'}
            </Text>
            <Text style={[styles.activeTeacherText, { color: colors.textSecondary }]}>
              🎓 Batch: {item.activeClass?.batch || 'General'} • Sem {item.activeClass?.semester || '1'} ({item.activeClass?.type || 'Regular'})
            </Text>
          </View>
        </View>
      )}

      {/* Expand/Collapse Day Schedule Action */}
      <Pressable
        style={[styles.expandTrigger, { borderTopColor: colors.border }]}
        onPress={() => setExpanded(!expanded)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={[styles.expandTriggerLeftText, { color: colors.textSecondary }]}>
          📖 {item.todayClassesCount} classes today
        </Text>
        <View style={styles.expandTriggerRight}>
          <Text style={[styles.expandTriggerText, { color: colors.primary }]}>
            {expanded ? 'Hide Details' : 'View Schedule'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.primary}
            style={{ marginLeft: 3 }}
          />
        </View>
      </Pressable>

      {/* Expanded Chronological Schedule Drawer */}
      {expanded ? (
        <View style={[styles.scheduleDrawer, { borderTopColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.scheduleDrawerTitle, { color: colors.textMuted }]}>
            Today's Schedule ({item.room})
          </Text>
          {item.schedule.length === 0 ? (
            <View style={[styles.emptyScheduleBox, { borderColor: colors.border }]}>
              <Text style={[styles.noScheduleText, { color: colors.textMuted }]}>Empty Schedule • Entire Day Free</Text>
            </View>
          ) : (
            item.schedule.map((cls, idx) => {
              const isOngoing = item.activeClass && (item.activeClass.classId === cls.classId || (item.activeClass.code === cls.code && item.activeClass.startTime === cls.startTime));
              return (
                <View
                  key={cls.classId || idx}
                  style={[
                    styles.scheduleRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    isOngoing && {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <View style={styles.timeTag}>
                    <Text style={[styles.timeTagText, { color: isOngoing ? colors.primary : colors.textPrimary }]}>
                      {format12HourTime(cls.startTime)} - {format12HourTime(cls.endTime)}
                    </Text>
                  </View>

                  <View style={styles.classDetailsColumn}>
                    <View style={styles.classTitleRow}>
                      <Text style={[styles.classTitleText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {cls.name}
                      </Text>
                      {isOngoing && (
                        <View style={[styles.nowBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.nowBadgeText}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.classMetaText, { color: colors.textMuted }]} numberOfLines={1}>
                      {cls.teacher} • Sem {cls.semester}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  freeCard: {
    borderLeftWidth: 3,
  },
  occupiedCard: {
    borderLeftWidth: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pharmacyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pharmacyText: {
    fontSize: 9,
    fontWeight: '700',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  freeContainer: {
    marginBottom: 8,
  },
  freeInfoBanner: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  freeHeaderStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  nextScheduleBox: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  nextScheduleTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextScheduleTime: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextScheduleDetail: {
    fontSize: 10,
    marginTop: 2,
  },
  noFurtherClassesBox: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noFurtherClassesText: {
    fontSize: 11,
    fontWeight: '600',
  },
  occupiedInfoBanner: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  occupiedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeLectureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  occupiedTimeRange: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeCourseText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  occupiedMetaCol: {
    gap: 2,
  },
  activeTeacherText: {
    fontSize: 11,
  },
  expandTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  expandTriggerLeftText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleDrawer: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderTopWidth: 1,
  },
  scheduleDrawerTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptyScheduleBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  noScheduleText: {
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
    marginBottom: 5,
    borderWidth: 1,
  },
  timeTag: {
    width: 105,
    marginRight: 6,
  },
  timeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  classDetailsColumn: {
    flex: 1,
  },
  classTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classTitleText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  nowBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  nowBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  classMetaText: {
    fontSize: 10,
    marginTop: 1,
  },
});
