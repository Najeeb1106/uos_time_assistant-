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
          shadowOpacity: isDark ? 0.15 : 0.04,
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

      <Text style={[styles.nameText, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
        {item.name}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItemRoom}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.room || 'TBA'}
          </Text>
        </View>

        <View style={styles.metaItemTeacher}>
          <Text style={styles.metaIcon}>👤</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.teacher || 'To be allocated'}
          </Text>
        </View>

        {sectionBadge ? (
          <Text style={[styles.tag, { backgroundColor: colors.surfaceElevated, color: colors.textMuted }]} numberOfLines={1}>
            {sectionBadge}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  timeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  nameText: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    width: '100%',
  },
  metaItemRoom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  metaItemTeacher: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  metaIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  metaText: {
    fontSize: 11.5,
    flexShrink: 1,
  },
  tag: {
    fontSize: 9.5,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
