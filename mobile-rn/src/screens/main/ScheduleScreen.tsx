import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MainTabNavigationProp } from '../../navigation/types';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { ClassLecture } from '../../models/Schedule';
import { getTodayDayName } from '../../utils/timeUtils';
import DaySelector from '../../components/schedule/DaySelector';
import ClassCard from '../../components/schedule/ClassCard';
import ClassDetailModal from '../../components/schedule/ClassDetailModal';
import OfflineBanner from '../../components/schedule/OfflineBanner';
import ScheduleEmptyState from '../../components/schedule/ScheduleEmptyState';
import CollapsibleHeader, { TOOLBAR_HEIGHT } from '../../components/common/CollapsibleHeader';
import ScheduleSkeleton from '../../components/ui/ScheduleSkeleton';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function ScheduleScreen() {
  const navigation = useNavigation<MainTabNavigationProp<'ScheduleTab'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const headerTotalHeight = TOOLBAR_HEIGHT + insets.top;
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    classes,
    isLoading,
    isRefreshing,
    isOffline,
    lastUpdated,
    fetchCurrentSchedule,
    refreshSchedule,
  } = useScheduleStore();

  const todayName = getTodayDayName();
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [selectedClass, setSelectedClass] = useState<ClassLecture | null>(null);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    fetchCurrentSchedule();
  }, []);

  const dayClasses = classes
    .filter((c) => c.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CollapsibleHeader
        title="Weekly Timetable"
        scrollY={scrollY}
      />

      {isOffline ? <OfflineBanner lastUpdated={lastUpdated} /> : null}

      {isLoading && classes.length === 0 ? (
        <View style={{ paddingTop: headerTotalHeight + 4, flex: 1 }}>
          <View style={styles.daySelectorWrapper}>
            <DaySelector
              selectedDay={selectedDay}
              onSelectDay={(day) => setSelectedDay(day)}
              activeTodayName={todayName}
            />
          </View>
          <ScheduleSkeleton count={3} />
        </View>
      ) : classes.length === 0 ? (
        <View style={{ paddingTop: headerTotalHeight, flex: 1 }}>
          <ScheduleEmptyState onUploadPress={() => navigation.navigate('UploadTab')} />
        </View>
      ) : (
        <Animated.FlatList
          data={dayClasses}
          keyExtractor={(item, index) => item.classId || `${item.code}_${item.day}_${item.startTime}_${index}`}
          ListHeaderComponent={
            <View style={styles.daySelectorWrapper}>
              <DaySelector
                selectedDay={selectedDay}
                onSelectDay={(day) => setSelectedDay(day)}
                activeTodayName={todayName}
              />
            </View>
          }
          renderItem={({ item }) => (
            <ClassCard item={item} onPress={(cls) => setSelectedClass(cls)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerTotalHeight + 4, paddingBottom: tabBarHeight + 24 },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshSchedule}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={headerTotalHeight}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyDayContainer}>
              <Text style={styles.emptyDayIcon}>☕</Text>
              <Text style={[styles.emptyDayTitle, { color: colors.textPrimary }]}>No Classes Scheduled</Text>
              <Text style={[styles.emptyDaySubtitle, { color: colors.textSecondary }]}>
                There are no lectures on {selectedDay} for your semester profile.
              </Text>
            </View>
          }
        />
      )}

      {/* Detailed Modal Dialog */}
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
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loaderText: {
    fontSize: Typography.sizes.sm,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  daySelectorWrapper: {
    marginHorizontal: -16,
    marginBottom: 8,
  },
  emptyDayContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyDayIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyDayTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: 6,
  },
  emptyDaySubtitle: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
});
