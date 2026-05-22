// High-Fidelity Interactive Dashboard Screen for UOS Timetable Mobile App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMobileStore } from '../store/useMobileStore';
import { COLORS, COMMON_STYLES } from '../components/Theme';

export default function DashboardScreen() {
  const user = useMobileStore((state) => state.user);
  const classes = useMobileStore((state) => state.classes) || [];
  const pdfFileName = useMobileStore((state) => state.pdfFileName);
  const isOnline = useMobileStore((state) => state.isOnline);
  const forceSync = useMobileStore((state) => state.forceSync);
  const theme = useMobileStore((state) => state.themeMode);
  
  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  // Dynamic day helper: returns the day name, fallback to Monday if weekend
  const getTodayDay = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[new Date().getDay()];
    return (currentDay === 'Saturday' || currentDay === 'Sunday') ? 'Monday' : currentDay;
  };

  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [currentTimeString, setCurrentTimeString] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Timer refresh effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeString(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Filter classes for the selected day
  const dayClasses = classes
    .filter((cls) => cls.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Determine next upcoming class for today
  const getNextClass = () => {
    const today = getTodayDay();
    const todayAllClasses = classes
      .filter((cls) => cls.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return todayAllClasses.find((cls) => cls.startTime > currentTimeString) || null;
  };

  // Check if a class is currently ongoing based on time
  const isClassOngoing = (cls) => {
    const today = getTodayDay();
    if (cls.day !== today) return false;
    return currentTimeString >= cls.startTime && currentTimeString <= cls.endTime;
  };

  const nextClass = getNextClass();
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline Mode', 'Cannot synchronize schedule while offline. Please restore your internet connection first.');
      return;
    }

    setSyncing(true);
    try {
      await forceSync();
      Alert.alert('Sync Successful', 'Your personal timetable schedule has been updated successfully!');
    } catch (error) {
      Alert.alert('Sync Failed', error.message || 'Unable to connect to the timetable backend.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header and Welcome */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { fontSize: 24, marginBottom: 2 }]}>
            Assalam-o-Alaikum,
          </Text>
          <Text style={[s.title, { fontSize: 22, color: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary, marginTop: 0 }]}>
            {user?.role === 'teacher' ? 'Prof. ' : ''}{user?.fullName || 'User'}!
          </Text>
        </View>

        {/* Dynamic connection indicator badge */}
        <View style={[
          styles.statusPill, 
          { backgroundColor: isOnline ? c.success + '1A' : c.warning + '1A', borderColor: isOnline ? c.success : c.warning }
        ]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? c.success : c.warning }]} />
          <Text style={[styles.statusText, { color: isOnline ? c.success : c.warning }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Sync Status Banner */}
      <View style={[styles.syncStatusBanner, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.mutedText, { fontSize: 12, marginBottom: 2 }]}>
            Active Timetable File:
          </Text>
          <Text style={[s.bodyText, { fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>
            {pdfFileName || 'No Timetable Synced'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: c.bgTertiary, borderColor: c.glassBorder }]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={c.accentPrimary} />
          ) : (
            <Ionicons name="sync" size={16} color={c.accentPrimary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Next Class Glowing Banner Widget */}
      {nextClass ? (
        <LinearGradient
          colors={user?.role === 'teacher' ? ['#1e1b4b', '#311042'] : ['#0b1532', '#160938']}
          style={[styles.nextClassCard, { borderColor: user?.role === 'teacher' ? c.accentSecondary + '50' : c.accentPrimary + '50' }]}
        >
          <View style={styles.nextClassHeader}>
            <View style={[styles.alertBadge, { backgroundColor: user?.role === 'teacher' ? c.accentSecondary + '2A' : c.accentPrimary + '2A' }]}>
              <Ionicons name="sparkles" size={14} color={user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary} />
              <Text style={[styles.alertBadgeText, { color: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }]}>
                Next Lecture
              </Text>
            </View>
            <Text style={[s.mutedText, { color: 'rgba(255,255,255,0.7)', fontSize: 12 }]}>
              Starts at {nextClass.startTime}
            </Text>
          </View>

          <Text style={styles.nextClassName} numberOfLines={1}>
            {nextClass.name}
          </Text>

          <View style={styles.nextClassDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color="#ffffff" style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {nextClass.room}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name={user?.role === 'teacher' ? 'people' : 'person'} size={14} color="#ffffff" style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {user?.role === 'teacher' ? `${nextClass.program} (${nextClass.type})` : nextClass.teacher}
              </Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[s.glassCard, styles.relaxCard, { backgroundColor: c.bgSecondary }]}>
          <Ionicons name="happy" size={28} color={c.success} />
          <Text style={[s.bodyText, { fontWeight: '700', marginTop: 8 }]}>No More Upcoming Classes Today</Text>
          <Text style={[s.mutedText, { fontSize: 12, marginTop: 2 }]}>Rest and prepare for your scheduled tasks!</Text>
        </View>
      )}

      {/* Weekday Selector Menu */}
      <View style={styles.tabsWrapper}>
        <Text style={[s.inputLabel, { marginBottom: 12 }]}>Day Selection Grid</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.weekdayScrollView}
          contentContainerStyle={styles.weekdayRow}
        >
          {weekdays.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  { backgroundColor: c.bgSecondary, borderColor: c.glassBorder },
                  isSelected && { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary }
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  { color: isSelected ? '#ffffff' : c.textSecondary }
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Day Schedule timeline list */}
      <View style={[s.glassCard, { paddingVertical: 16 }]}>
        <View style={styles.timelineHeader}>
          <Text style={[s.bodyText, { fontWeight: '700', fontSize: 16 }]}>
            {selectedDay} Schedule
          </Text>
          <Text style={[s.mutedText, { fontSize: 12 }]}>
            System Time: {currentTimeString}
          </Text>
        </View>

        {dayClasses.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Ionicons name="cafe" size={32} color={c.textMuted} />
            <Text style={[s.mutedText, { marginTop: 8, fontSize: 14 }]}>
              No lectures scheduled for {selectedDay}. Enjoy your day!
            </Text>
          </View>
        ) : (
          <View style={styles.timelineList}>
            {dayClasses.map((cls, index) => {
              const ongoing = isClassOngoing(cls);
              return (
                <View key={cls.classId} style={styles.timelineItem}>
                  {/* Left timeline dot indicator column */}
                  <View style={styles.timelineDotColumn}>
                    <View style={[
                      styles.dot, 
                      { backgroundColor: c.bgTertiary, borderColor: c.glassBorder },
                      ongoing && { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary }
                    ]} />
                    {index < dayClasses.length - 1 && <View style={[styles.line, { backgroundColor: c.bgTertiary }]} />}
                  </View>

                  {/* Class Card */}
                  <View style={[
                    styles.classCard,
                    { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                    ongoing && { borderColor: c.accentPrimary, backgroundColor: c.bgTertiary }
                  ]}>
                    <View style={styles.cardHeader}>
                      <Text style={[s.bodyText, { fontWeight: '700', flex: 1 }]} numberOfLines={1}>
                        {cls.name}
                      </Text>
                      <View style={[styles.codeBadge, { backgroundColor: c.bgTertiary }]}>
                        <Text style={[styles.codeBadgeText, { color: c.textSecondary }]}>
                          #{cls.code}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardDetailRow}>
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="time" size={12} color={c.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[s.mutedText, { fontSize: 12 }]}>
                          {cls.startTime} - {cls.endTime}
                        </Text>
                      </View>
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="location" size={12} color={c.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[s.mutedText, { fontSize: 12 }]} numberOfLines={1}>
                          {cls.room}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardMetaItem}>
                      <Ionicons name={user?.role === 'teacher' ? 'people' : 'person'} size={12} color={c.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[s.mutedText, { fontSize: 12 }]} numberOfLines={1}>
                        {user?.role === 'teacher' ? `${cls.program} (${cls.type})` : cls.teacher}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  syncStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  nextClassCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  nextClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  nextClassName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  nextClassDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  detailIcon: {
    marginRight: 6,
    opacity: 0.8,
  },
  detailText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  relaxCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  tabsWrapper: {
    marginBottom: 20,
  },
  weekdayScrollView: {
    marginHorizontal: -20,
  },
  weekdayRow: {
    gap: 8,
    paddingHorizontal: 20,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyTimeline: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineList: {
    paddingHorizontal: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotColumn: {
    alignItems: 'center',
    marginRight: 12,
    width: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  classCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 2,
  }
});
