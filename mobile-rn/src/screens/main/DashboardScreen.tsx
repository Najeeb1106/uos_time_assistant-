import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Pressable,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/types';
import { useMobileStore } from '../../stores/useMobileStore';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ClassLecture } from '../../models/Schedule';
import {
  format12HourTime,
  getTodayDayName,
  getCurrentTimeString,
  formatCountdown,
  getTodayClasses,
  getNextClass,
  getSecondNextClass,
  isClassOngoing,
  isWeekend,
} from '../../utils/timeUtils';
import ClassCard from '../../components/schedule/ClassCard';
import ClassDetailModal from '../../components/schedule/ClassDetailModal';
import OfflineBanner from '../../components/schedule/OfflineBanner';
import ScheduleEmptyState from '../../components/schedule/ScheduleEmptyState';
import NextClassAlertCard from '../../components/schedule/NextClassAlertCard';
import CollapsibleHeader, { TOOLBAR_HEIGHT } from '../../components/common/CollapsibleHeader';

export default function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const user = useMobileStore((state) => state.user);
  const {
    classes,
    isLoading,
    isOffline,
    lastUpdated,
    fetchCurrentSchedule,
    refreshSchedule,
  } = useScheduleStore();

  const [selectedClass, setSelectedClass] = useState<ClassLecture | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCurrentSchedule();
  }, [fetchCurrentSchedule]);

  const todayName = getTodayDayName();
  const todayClasses = getTodayClasses(classes);
  const nowTime = getCurrentTimeString();
  const ongoingClass = todayClasses.find((c) => isClassOngoing(c, nowTime)) || null;
  const nextClass = getNextClass(classes, nowTime);
  const secondNextClass = getSecondNextClass(classes, nowTime);
  const weekendNotice = isWeekend(classes);

  // If ongoingClass is active, the next class is the first one starting after ongoingClass ends
  const subsequentClass = ongoingClass
    ? todayClasses.find((c) => c.startTime >= ongoingClass.endTime) || null
    : nextClass
    ? todayClasses.find((c) => c.startTime >= nextClass.endTime) || null
    : null;

  const headerTotalHeight = TOOLBAR_HEIGHT + insets.top;
  const tabBarHeight = 54 + (insets.bottom > 0 ? insets.bottom : 8);

  // Theme tokens matching the unified UOS Navy / Gold / Purple palette
  const bgCanvas = colors.background;
  const cardSurface = colors.surface;
  const cardElevated = colors.surfaceElevated;
  const textTitle = colors.textPrimary;
  const textSub = colors.textSecondary;
  const borderLine = colors.border;
  const subtleBorder = colors.borderSubtle;

  // Compute initials for user avatar
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const displayName = user?.fullName ? user.fullName : 'Student';

  return (
    <View style={[styles.container, { backgroundColor: bgCanvas }]}>
      {/* 1. Header: Dashboard Overview */}
      <CollapsibleHeader
        title="Dashboard Overview"
        scrollY={scrollY}
      />

      {isOffline ? <OfflineBanner lastUpdated={lastUpdated} /> : null}

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + 12, paddingBottom: tabBarHeight + 24 },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await refreshSchedule();
              setIsRefreshing(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={headerTotalHeight}
          />
        }
      >
        {/* 2. Compact User Greeting Section with Dynamic Avatar */}
        <View style={styles.greetingContainer}>
          <View style={styles.greetingLeftRow}>
            {/* Avatar Circle */}
            <View style={[styles.avatarCircle, { backgroundColor: cardElevated, borderColor: colors.borderFocus }]}>
              {user?.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {getUserInitials(user?.fullName)}
                </Text>
              )}
            </View>

            {/* Greeting Text Block */}
            <View style={styles.greetingTextBlock}>
              <View style={styles.greetingTitleRow}>
                <Text style={[styles.greetingSalutation, { color: textTitle }]}>
                  Assalam-o-Alaikum,{' '}
                </Text>
                <Text style={[styles.greetingName, { color: colors.primary }]}>
                  {displayName}!
                </Text>
              </View>
              <Text style={[styles.greetingSubtitle, { color: textSub }]}>
                Here’s your schedule summary for today.
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Main Dashboard Body States */}
        {isLoading && classes.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: textSub }]}>Loading your schedule...</Text>
          </View>
        ) : classes.length === 0 ? (
          <ScheduleEmptyState onUploadPress={() => navigation.navigate('UploadTab')} />
        ) : (
          <>
            {/* 4. Ongoing and Next Class Cards */}
            {(ongoingClass || nextClass) ? (
              <View style={[styles.mainLectureCard, { backgroundColor: cardSurface, borderColor: borderLine }]}>
                {/* SECTION A: ONGOING LECTURE */}
                {ongoingClass ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.lectureItemPressable,
                      { opacity: pressed ? 0.92 : 1 },
                    ]}
                    onPress={() => setSelectedClass(ongoingClass)}
                  >
                    {/* Top Status Header */}
                    <View style={styles.lectureHeaderRow}>
                      <View style={[styles.statusBadgeOngoing, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                        <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
                        <Text style={[styles.statusBadgeTextOngoing, { color: colors.success }]}>
                          Ongoing Lecture
                        </Text>
                      </View>
                      <Text style={[styles.timeRemainingText, { color: textSub }]}>
                        Ends at {format12HourTime(ongoingClass.endTime)}
                      </Text>
                    </View>

                    {/* Subject Title */}
                    <Text style={[styles.lectureTitle, { color: textTitle }]} numberOfLines={2}>
                      {ongoingClass.name}
                    </Text>

                    {/* Meta Badges */}
                    <View style={styles.metaBadgesRow}>
                      {/* Room Pill */}
                      <View style={[styles.purplePill, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
                        <Ionicons name="location-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.purplePillText, { color: colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
                          {ongoingClass.room || 'TBA'}
                        </Text>
                      </View>

                      {/* Time Pill */}
                      <View style={[styles.neutralPill, { backgroundColor: cardElevated, borderColor: subtleBorder }]}>
                        <Ionicons name="time-outline" size={12} color={textSub} style={{ marginRight: 4 }} />
                        <Text style={[styles.neutralPillText, { color: textSub }]}>
                          {format12HourTime(ongoingClass.startTime)} - {format12HourTime(ongoingClass.endTime)}
                        </Text>
                      </View>

                      {/* Instructor Pill if present */}
                      {ongoingClass.teacher ? (
                        <View style={[styles.neutralPill, { backgroundColor: cardElevated, borderColor: subtleBorder }]}>
                          <Ionicons name="person-outline" size={12} color={textSub} style={{ marginRight: 4 }} />
                          <Text style={[styles.neutralPillText, { color: textSub }]} numberOfLines={1} ellipsizeMode="tail">
                            {ongoingClass.teacher}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ) : (
                  // No Ongoing Lecture Right Now State
                  <View style={styles.noOngoingBox}>
                    <View style={styles.lectureHeaderRow}>
                      <View style={[styles.statusBadgeIdle, { backgroundColor: cardElevated, borderColor: borderLine }]}>
                        <Ionicons name="cafe-outline" size={12} color={textSub} style={{ marginRight: 5 }} />
                        <Text style={[styles.statusBadgeTextIdle, { color: textSub }]}>
                          No Active Lecture Right Now
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.idleSubText, { color: textSub }]}>
                      You are currently free. Next lecture is scheduled below:
                    </Text>
                  </View>
                )}

                {/* Subtle Divider between Ongoing and Next */}
                {(ongoingClass && subsequentClass) || (!ongoingClass && nextClass) ? (
                  <View style={[styles.cardDivider, { backgroundColor: borderLine }]} />
                ) : null}

                {/* SECTION B: UP NEXT / NEXT LECTURE */}
                {ongoingClass && subsequentClass ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.lectureItemPressable,
                      { opacity: pressed ? 0.92 : 1 },
                    ]}
                    onPress={() => setSelectedClass(subsequentClass)}
                  >
                    {/* Next Header */}
                    <View style={styles.lectureHeaderRow}>
                      <View style={[styles.statusBadgeNext, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
                        <Ionicons name="arrow-forward-circle-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusBadgeTextNext, { color: colors.primary }]}>
                          Next Lecture
                        </Text>
                      </View>
                      <Text style={[styles.countdownText, { color: colors.primary }]}>
                        Starts at {format12HourTime(subsequentClass.startTime)}
                      </Text>
                    </View>

                    {/* Subject Title */}
                    <Text style={[styles.lectureTitleSecondary, { color: textTitle }]} numberOfLines={2}>
                      {subsequentClass.name}
                    </Text>

                    {/* Meta Badges */}
                    <View style={styles.metaBadgesRow}>
                      {/* Room Pill */}
                      <View style={[styles.purplePill, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
                        <Ionicons name="location-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.purplePillText, { color: colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
                          {subsequentClass.room || 'TBA'}
                        </Text>
                      </View>

                      {/* Time Pill */}
                      <View style={[styles.neutralPill, { backgroundColor: cardElevated, borderColor: subtleBorder }]}>
                        <Ionicons name="time-outline" size={12} color={textSub} style={{ marginRight: 4 }} />
                        <Text style={[styles.neutralPillText, { color: textSub }]}>
                          {format12HourTime(subsequentClass.startTime)} - {format12HourTime(subsequentClass.endTime)}
                        </Text>
                      </View>

                      {/* Instructor Pill if present */}
                      {subsequentClass.teacher ? (
                        <View style={[styles.neutralPill, { backgroundColor: cardElevated, borderColor: subtleBorder }]}>
                          <Ionicons name="person-outline" size={12} color={textSub} style={{ marginRight: 4 }} />
                          <Text style={[styles.neutralPillText, { color: textSub }]} numberOfLines={1} ellipsizeMode="tail">
                            {subsequentClass.teacher}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ) : !ongoingClass && nextClass ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.lectureItemPressable,
                      { opacity: pressed ? 0.92 : 1 },
                    ]}
                    onPress={() => setSelectedClass(nextClass)}
                  >
                    {/* Next Header */}
                    <View style={styles.lectureHeaderRow}>
                      <View style={[styles.statusBadgeNext, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
                        <Ionicons name="alarm-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusBadgeTextNext, { color: colors.primary }]}>
                          Next Class Alert
                        </Text>
                      </View>
                      <Text style={[styles.countdownText, { color: colors.primary }]}>
                        {formatCountdown(nextClass.startTime, nowTime)}
                      </Text>
                    </View>

                    {/* Subject Title */}
                    <Text style={[styles.lectureTitle, { color: textTitle }]} numberOfLines={2}>
                      {nextClass.name}
                    </Text>

                    {/* Meta Badges */}
                    <View style={styles.metaBadgesRow}>
                      {/* Room Pill */}
                      <View style={[styles.purplePill, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
                        <Ionicons name="location-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.purplePillText, { color: colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
                          {nextClass.room || 'TBA'}
                        </Text>
                      </View>

                      {/* Time Pill */}
                      <View style={[styles.neutralPill, { backgroundColor: cardElevated, borderColor: subtleBorder }]}>
                        <Ionicons name="time-outline" size={12} color={textSub} style={{ marginRight: 4 }} />
                        <Text style={[styles.neutralPillText, { color: textSub }]}>
                          {format12HourTime(nextClass.startTime)} - {format12HourTime(nextClass.endTime)}
                        </Text>
                      </View>

                      {/* Instructor Pill if present */}
                      {nextClass.teacher ? (
                        <View style={[styles.neutralPill, { backgroundColor: cardElevated, borderColor: subtleBorder }]}>
                          <Ionicons name="person-outline" size={12} color={textSub} style={{ marginRight: 4 }} />
                          <Text style={[styles.neutralPillText, { color: textSub }]} numberOfLines={1} ellipsizeMode="tail">
                            {nextClass.teacher}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Weekend Status Notice */}
            {weekendNotice ? (
              <View style={[styles.weekendCard, { backgroundColor: cardSurface, borderColor: borderLine }]}>
                <Text style={styles.weekendIcon}>🌴</Text>
                <Text style={[styles.weekendTitle, { color: textTitle }]}>Weekend Notice</Text>
                <Text style={[styles.weekendText, { color: textSub }]}>
                  No regular classes scheduled for today. Rest up for the upcoming week!
                </Text>
              </View>
            ) : null}

            {/* 5. Today's Full Schedule Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textTitle }]}>
                Today's Schedule ({todayClasses.length})
              </Text>
              <Pressable onPress={() => navigation.navigate('ScheduleTab')} hitSlop={8}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>Full Week →</Text>
              </Pressable>
            </View>

            {todayClasses.length === 0 && !weekendNotice ? (
              <View style={[styles.noClassesCard, { backgroundColor: cardSurface, borderColor: borderLine }]}>
                <Text style={[styles.noClassesText, { color: textSub }]}>
                  🎉 No lectures scheduled for today!
                </Text>
              </View>
            ) : (
              todayClasses.map((cls) => (
                <ClassCard
                  key={cls.classId || `${cls.code}_${cls.startTime}`}
                  item={cls}
                  onPress={(item) => setSelectedClass(item)}
                />
              ))
            )}
          </>
        )}
      </Animated.ScrollView>

      {/* Class Detail Modal */}
      <ClassDetailModal
        visible={!!selectedClass}
        item={selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  greetingContainer: {
    marginBottom: 16,
  },
  greetingLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  greetingTextBlock: {
    flex: 1,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  greetingSalutation: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  greetingSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  loaderContainer: {
    padding: 36,
    alignItems: 'center',
  },
  loaderText: {
    fontSize: Typography.sizes.sm,
    marginTop: 12,
  },
  mainLectureCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  lectureItemPressable: {
    width: '100%',
  },
  lectureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadgeOngoing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeTextOngoing: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  timeRemainingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadgeNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusBadgeTextNext: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noOngoingBox: {
    paddingVertical: 4,
  },
  statusBadgeIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusBadgeTextIdle: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  idleSubText: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  lectureTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
    lineHeight: 21,
  },
  lectureTitleSecondary: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
    lineHeight: 19,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  purplePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  purplePillText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  neutralPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  neutralPillText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
  },
  weekendCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  weekendIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  weekendTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  weekendText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  allDoneCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  allDoneTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  allDoneText: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  noClassesCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  noClassesText: {
    fontSize: Typography.sizes.sm,
  },
});
