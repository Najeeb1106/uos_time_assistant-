import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { getGlobalScheduleApi } from '../../api/scheduleApi';
import { ClassLecture } from '../../models/Schedule';
import { calculateAllRoomStatuses } from '../../utils/freeRoomUtils';
import {
  saveGlobalScheduleCache,
  loadGlobalScheduleCache,
} from '../../utils/freeRoomCache';
import { getBuiltinMasterClasses } from '../../utils/builtinScheduleUtils';
import {
  getTodayDayName,
  getCurrentTimeString,
  format12HourTime,
} from '../../utils/timeUtils';
import RoomCard from '../../components/freerooms/RoomCard';
import RoomFilter from '../../components/freerooms/RoomFilter';
import FreeRoomEmptyState from '../../components/freerooms/FreeRoomEmptyState';
import OfflineBanner from '../../components/schedule/OfflineBanner';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function FreeRoomsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, isDark, toggleTheme } = useTheme();

  // State
  const [masterClasses, setMasterClasses] = useState<ClassLecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Filter States
  const todayActual = getTodayDayName();
  const [selectedDay, setSelectedDay] = useState<string>(todayActual);
  const [selectedTime, setSelectedTime] = useState<string>(getCurrentTimeString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Classrooms' | 'Labs'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Free' | 'Occupied'>('All');

  // Modal Sheet State
  const [activeFilterModal, setActiveFilterModal] = useState<'category' | 'status' | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  // Fetch Master Dataset
  const fetchGlobalSchedule = async () => {
    setIsLoading(true);
    try {
      const cached = await loadGlobalScheduleCache();
      if (cached && cached.classes && cached.classes.length > 0) {
        setMasterClasses(cached.classes);
        setLastUpdated(cached.uploadedAt || new Date().toISOString());
      } else {
        // Instant offline fallback to built-in master dataset
        const builtinMaster = getBuiltinMasterClasses();
        setMasterClasses(builtinMaster);
        setLastUpdated(new Date().toISOString());
      }

      const response = await getGlobalScheduleApi();
      if (response.success && response.classes && response.classes.length > 0) {
        setMasterClasses(response.classes);
        setIsOffline(false);
        setLastUpdated(new Date().toISOString());

        await saveGlobalScheduleCache({
          classes: response.classes,
          pdfFileName: response.pdfFileName,
          uploadedAt: response.uploadedAt,
        });
      }
    } catch (err: any) {
      if (masterClasses.length === 0) {
        setMasterClasses(getBuiltinMasterClasses());
      }
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await getGlobalScheduleApi();
      if (response.success && response.classes) {
        setMasterClasses(response.classes);
        setIsOffline(false);
        setLastUpdated(new Date().toISOString());

        await saveGlobalScheduleCache({
          classes: response.classes,
          pdfFileName: response.pdfFileName,
          uploadedAt: response.uploadedAt,
        });
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalSchedule();
  }, []);

  const handleResetToNow = () => {
    setSelectedDay(getTodayDayName());
    setSelectedTime(getCurrentTimeString());
  };

  const allRoomStatuses = useMemo(() => {
    return calculateAllRoomStatuses(masterClasses, selectedDay, selectedTime);
  }, [masterClasses, selectedDay, selectedTime]);

  const totalRoomsCount = allRoomStatuses.length;
  const freeRoomsCount = allRoomStatuses.filter((r) => r.isFree).length;
  const occupiedRoomsCount = allRoomStatuses.filter((r) => !r.isFree).length;

  const displayedRooms = useMemo(() => {
    return allRoomStatuses.filter((item) => {
      const matchesSearch = item.room.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Free' && item.isFree) ||
        (statusFilter === 'Occupied' && !item.isFree);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [allRoomStatuses, searchQuery, categoryFilter, statusFilter]);

  const sections = useMemo(() => {
    const freeRooms = displayedRooms.filter((r) => r.isFree);
    const occupiedRooms = displayedRooms.filter((r) => !r.isFree);

    const result = [];
    if (statusFilter === 'All' || statusFilter === 'Free') {
      if (freeRooms.length > 0 || statusFilter === 'Free') {
        result.push({
          title: `FREE ROOMS (${freeRooms.length})`,
          isFreeSection: true,
          data: freeRooms,
        });
      }
    }
    if (statusFilter === 'All' || statusFilter === 'Occupied') {
      if (occupiedRooms.length > 0 || statusFilter === 'Occupied') {
        result.push({
          title: `OCCUPIED ROOMS (${occupiedRooms.length})`,
          isFreeSection: false,
          data: occupiedRooms,
        });
      }
    }
    return result;
  }, [displayedRooms, statusFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Clean Top Bar: ONLY Title on Left */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          Free Room Finder
        </Text>
      </View>

      {isOffline ? <OfflineBanner lastUpdated={lastUpdated} /> : null}

      {/* Main Content List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.room}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* 2. Compact, Sleek 3-Column Statistics Bar */}
            <View style={styles.kpiRow}>
              {/* Total Rooms */}
              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.kpiIconBoxNeutral, { backgroundColor: colors.badgeBg }]}>
                  <Ionicons name="layers-outline" size={14} color={colors.primary} />
                </View>
                <View style={styles.kpiContentCol}>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>TOTAL</Text>
                  <Text style={[styles.kpiValueNeutral, { color: colors.textPrimary }]}>{totalRoomsCount}</Text>
                </View>
              </View>

              {/* Free Right Now */}
              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(5, 150, 105, 0.25)',
                  },
                ]}
              >
                <View style={[styles.kpiIconBoxFree, { backgroundColor: colors.successBg }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                </View>
                <View style={styles.kpiContentCol}>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>FREE NOW</Text>
                  <Text style={[styles.kpiValueFree, { color: colors.success }]}>{freeRoomsCount}</Text>
                </View>
              </View>

              {/* Occupied Now */}
              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(220, 38, 38, 0.25)',
                  },
                ]}
              >
                <View style={[styles.kpiIconBoxOccupied, { backgroundColor: colors.errorBg }]}>
                  <Ionicons name="close-circle" size={14} color={colors.error} />
                </View>
                <View style={styles.kpiContentCol}>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>OCCUPIED</Text>
                  <Text style={[styles.kpiValueOccupied, { color: colors.error }]}>{occupiedRoomsCount}</Text>
                </View>
              </View>
            </View>

            {/* 3. Day Selector Horizontal Chips */}
            <View style={styles.daySelectorWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipContainer}>
                {DAYS.map((day) => {
                  const isSelected = selectedDay === day;
                  const isToday = day === todayActual;
                  return (
                    <Pressable
                      key={day}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                        isSelected && {
                          backgroundColor: colors.buttonGradientStart,
                          borderColor: colors.buttonGradientStart,
                        },
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          { color: colors.textSecondary },
                          isSelected && styles.dayChipTextActive,
                        ]}
                      >
                        {day.slice(0, 3)}
                      </Text>
                      {isToday && (
                        <View
                          style={[
                            styles.todayIndicatorDot,
                            { backgroundColor: isSelected ? '#ffffff' : colors.primary },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. Time Trigger & Search Bar */}
            <View style={styles.timeSearchRow}>
              {/* Time Trigger */}
              <Pressable
                style={[
                  styles.timeSelectTrigger,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setIsTimeModalOpen(true)}
              >
                <Ionicons name="time-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.timeSelectText, { color: colors.textPrimary }]}>{format12HourTime(selectedTime)}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </Pressable>

              {/* Search Bar with integrated Reset Icon */}
              <View
                style={[
                  styles.searchWrapper,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="search-outline" size={14} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search room (e.g. CR-224, Lab 1)..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 ? (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                  </Pressable>
                ) : (
                  <Pressable onPress={handleResetToNow} hitSlop={6} style={styles.nowResetIconBtn}>
                    <Ionicons name="refresh-outline" size={15} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* 5. Minimal Filter Chips */}
            <View style={styles.filterChipRow}>
              {/* Room Type */}
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  categoryFilter !== 'All' && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveFilterModal('category')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    categoryFilter !== 'All' && styles.filterChipTextActive,
                  ]}
                >
                  Type: {categoryFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={11}
                  color={categoryFilter !== 'All' ? '#ffffff' : colors.textSecondary}
                  style={{ marginLeft: 3 }}
                />
              </Pressable>

              {/* Occupancy Status */}
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  statusFilter === 'Free' && {
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                  },
                  statusFilter === 'Occupied' && {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                  },
                ]}
                onPress={() => setActiveFilterModal('status')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    statusFilter !== 'All' && styles.filterChipTextActive,
                  ]}
                >
                  Status: {statusFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={11}
                  color={statusFilter !== 'All' ? '#ffffff' : colors.textSecondary}
                  style={{ marginLeft: 3 }}
                />
              </Pressable>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <View
                style={[
                  styles.sectionIndicatorDot,
                  { backgroundColor: section.isFreeSection ? colors.success : colors.error },
                ]}
              />
              <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{section.title}</Text>
            </View>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: section.isFreeSection ? colors.successBg : colors.errorBg },
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  { color: section.isFreeSection ? colors.success : colors.error },
                ]}
              >
                {section.data.length} Rooms
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => <RoomCard item={item} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading timetable...</Text>
            </View>
          ) : masterClasses.length === 0 ? (
            <FreeRoomEmptyState type="no_master_data" onRetry={fetchGlobalSchedule} />
          ) : (
            <FreeRoomEmptyState type="no_filter_match" />
          )
        }
      />

      {/* Filter Bottom Sheets */}
      <RoomFilter
        visible={activeFilterModal !== null}
        type={activeFilterModal}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClose={() => setActiveFilterModal(null)}
      />

      {/* Time Picker Modal */}
      <RoomFilter
        visible={isTimeModalOpen}
        type="time"
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        timeSlots={TIME_SLOTS}
        onClose={() => setIsTimeModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  themeToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerContainer: {
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  kpiIconBoxNeutral: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  kpiIconBoxFree: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  kpiIconBoxOccupied: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  kpiContentCol: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 11,
    marginBottom: 1,
    textAlign: 'center',
  },
  kpiValueNeutral: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  kpiValueFree: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  kpiValueOccupied: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  daySelectorWrapper: {
    marginBottom: 8,
  },
  dayChipContainer: {
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  timeSearchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeSelectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  timeSelectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    height: '100%',
  },
  nowResetIconBtn: {
    padding: 2,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.sizes.sm,
  },
});
