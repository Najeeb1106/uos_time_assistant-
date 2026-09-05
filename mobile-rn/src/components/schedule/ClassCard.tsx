import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ClassLecture } from '../../models/Schedule';
import { format12HourTime, isClassOngoing } from '../../utils/timeUtils';
import { getClassSectionDisplay } from '../../utils/sectionUtils';
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

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0.2 : 0.05,
        },
        ongoing && {
          borderColor: colors.primary,
          borderWidth: 1.5,
          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.05)',
        },
      ]}
      onPress={() => onPress && onPress(item)}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.codeText, { color: colors.primary }]}>{item.code || 'COURSE'}</Text>

          {ongoing ? (
            <View style={[styles.ongoingBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)' }]}>
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

      <Text style={[styles.nameText, { color: colors.textPrimary }]}>
        {item.name}
      </Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.room || 'TBA'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>👨‍🏫</Text>
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.teacher || 'To be allocated'}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.tag, { backgroundColor: colors.surfaceElevated, color: colors.textMuted }]}>
          {sectionBadge}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  ongoingBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 21,
  },
  detailsContainer: {
    gap: 4,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 2,
  },
  detailText: {
    fontSize: Typography.sizes.xs,
    flex: 1,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tag: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
