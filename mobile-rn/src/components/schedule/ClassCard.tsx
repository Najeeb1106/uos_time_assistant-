import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ClassLecture } from '../../models/Schedule';
import { format12HourTime, isClassOngoing } from '../../utils/timeUtils';
import { getClassSectionDisplay } from '../../utils/sectionUtils';
import { parseLocation } from '../../utils/locationUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface ClassCardProps {
  item: ClassLecture;
  onPress?: (item: ClassLecture) => void;
}

export default function ClassCard({ item, onPress }: ClassCardProps) {
  const { colors, isDark } = useTheme();
  const ongoing = isClassOngoing(item);
  const sectionBadge = getClassSectionDisplay(item);
  const locationInfo = parseLocation(item.room);

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0.16 : 0.05,
        },
      ]}
      onPress={() => onPress && onPress(item)}
    >
      {/* Header Row: Course Code + Ongoing Badge & Time Slot */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.codeText, { color: colors.primary }]}>{item.code || 'COURSE'}</Text>

          {ongoing ? (
            <View
              style={[
                styles.ongoingBadge,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)' },
              ]}
            >
              <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.ongoingBadgeText, { color: colors.success }]}>ONGOING</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.timeBadge, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {format12HourTime(item.startTime)} - {format12HourTime(item.endTime)}
          </Text>
        </View>
      </View>

      {/* Course Title */}
      <Text style={[styles.nameText, { color: colors.textPrimary }]} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Location Area: Full Department Name + Building & Room Number */}
      <View style={styles.locationContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <View style={styles.locationContent}>
          <Text style={[styles.departmentText, { color: colors.textSecondary }]}>
            {locationInfo.department}
          </Text>
          {locationInfo.roomNumber ? (
            <Text style={[styles.roomNumberText, { color: colors.primary }]}>
              {locationInfo.roomNumber}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Footer Row: Teacher / Instructor & Section Tag Badge */}
      <View style={styles.footerRow}>
        <View style={styles.teacherContainer}>
          <Text style={styles.metaIcon}>👤</Text>
          <Text
            style={[styles.teacherText, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.teacher || 'To be allocated'}
          </Text>
        </View>

        {sectionBadge ? (
          <View style={[styles.tagContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.tagText, { color: colors.textMuted }]} numberOfLines={1}>
              {sectionBadge}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3.5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  codeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  ongoingBadgeText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
  },
  timeBadge: {
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
    lineHeight: 19,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 5,
    marginTop: 1,
  },
  locationContent: {
    flex: 1,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.5,
  },
  roomNumberText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16.5,
    marginTop: 1.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  metaIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  teacherText: {
    fontSize: 11.5,
    flexShrink: 1,
  },
  tagContainer: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
});
