import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClassLecture } from '../../models/Schedule';
import { format12HourTime, formatCountdown, isWeekend } from '../../utils/timeUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface NextClassAlertCardProps {
  nextClass: ClassLecture | null;
  secondNextClass?: ClassLecture | null;
  todayClassesCount: number;
  allClasses: ClassLecture[];
  nowTime: string;
  isTeacher?: boolean;
  onPress?: (cls: ClassLecture) => void;
}

export default function NextClassAlertCard({
  nextClass,
  secondNextClass,
  todayClassesCount,
  allClasses,
  nowTime,
  isTeacher = false,
  onPress,
}: NextClassAlertCardProps) {
  const { colors, isDark } = useTheme();

  const isWeekendNotice = isWeekend(allClasses);

  // Card theme styling
  const cardBg = colors.surface;
  const cardBorder = colors.border;
  const detailsBg = colors.surfaceElevated;
  const detailsBorder = colors.border;
  const accentColor = colors.primary;

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Header with Bell and Status */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="notifications" size={15} color={accentColor} />
            </View>
            <Text style={[styles.headerBadgeText, { color: accentColor }]}>
              NEXT CLASS ALERT
            </Text>
          </View>

          {nextClass && (
            <View style={[styles.countdownBadge, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="time-outline" size={12} color={accentColor} style={{ marginRight: 4 }} />
              <Text style={[styles.countdownText, { color: accentColor }]}>
                {formatCountdown(nextClass.startTime, nowTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Content Body */}
        {nextClass ? (
          <Pressable
            style={({ pressed }) => [
              styles.pressableContent,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => onPress && onPress(nextClass)}
          >
            {/* Subject Title */}
            <Text style={[styles.subjectTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {nextClass.name}
            </Text>

            {/* Subtitle / Next up teaser */}
            {secondNextClass ? (
              <Text style={[styles.subsequentText, { color: colors.primary }]} numberOfLines={1}>
                Next: {secondNextClass.name} at {format12HourTime(secondNextClass.startTime)}
              </Text>
            ) : (
              <Text style={[styles.helperSubtitle, { color: colors.textSecondary }]}>
                Your next class is coming up.
              </Text>
            )}

            {/* Structured Details Box */}
            <View style={[styles.detailsBox, { backgroundColor: detailsBg, borderColor: detailsBorder }]}>
              {/* Row 1: Time */}
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={15} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Starts at:{' '}
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {format12HourTime(nextClass.startTime)}
                  </Text>
                  {'  '}({format12HourTime(nextClass.startTime)} - {format12HourTime(nextClass.endTime)})
                </Text>
              </View>

              {/* Row 2: Location */}
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={15} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Location:{' '}
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    Room {nextClass.room || 'TBA'}
                  </Text>
                </Text>
              </View>

              {/* Row 3: Teacher / Cohort */}
              <View style={styles.detailRow}>
                {isTeacher ? (
                  <>
                    <Ionicons name="school-outline" size={15} color={colors.primary} style={styles.detailIcon} />
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                      Class:{' '}
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {nextClass.program || 'Program'} • {nextClass.type || 'Regular'} (Sem {nextClass.semester || 1})
                      </Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="person-outline" size={15} color={colors.primary} style={styles.detailIcon} />
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                      Instructor:{' '}
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {nextClass.teacher || 'To be allocated'}
                      </Text>
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        ) : todayClassesCount > 0 ? (
          /* Exact Web Message when all classes finished today */
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconRow}>
              <Ionicons name="checkmark-done-circle" size={24} color={colors.success} style={{ marginRight: 8 }} />
              <Text style={[styles.allDoneHeader, { color: colors.textPrimary }]}>
                Day Complete
              </Text>
            </View>
            <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
              No more lectures scheduled for the remainder of today. Time to work on your assignments!
            </Text>
          </View>
        ) : (
          /* Empty state when no classes on today's schedule */
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconRow}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.allDoneHeader, { color: colors.textPrimary }]}>
                {isWeekendNotice ? 'Weekend Break' : 'No Lectures Today'}
              </Text>
            </View>
            <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
              {isWeekendNotice
                ? 'Enjoy your weekend! No lectures scheduled for today.'
                : 'No classes scheduled for today. Rest day!'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginTop: 18,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  pressableContent: {
    marginTop: 2,
  },
  subjectTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
    lineHeight: 23,
  },
  subsequentText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  helperSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
  },
  detailsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
  },
  detailValue: {
    fontWeight: '700',
  },
  emptyStateContainer: {
    paddingVertical: 6,
  },
  emptyIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  allDoneHeader: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateMessage: {
    fontSize: 13,
    lineHeight: 19,
  },
});
