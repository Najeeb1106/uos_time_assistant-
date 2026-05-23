// Premium Interactive Weekly Schedule Screen with Search, Filtering & Glassmorphic Modal Cards
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileStore } from '../store/useMobileStore';
import { COLORS, COMMON_STYLES } from '../components/Theme';

export default function WeeklyScheduleScreen() {
  const user = useMobileStore((state) => state.user);
  const classes = useMobileStore((state) => state.classes) || [];
  const theme = useMobileStore((state) => state.themeMode);

  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detailed Class Modal state
  const [selectedClass, setSelectedClass] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Filter classes based on selected day and search text (search filters by name, code, room, or teacher)
  const filteredClasses = classes
    .filter((cls) => {
      if (cls.day !== selectedDay) return false;
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = cls.name?.toLowerCase().includes(query);
      const codeMatch = cls.code?.toLowerCase().includes(query);
      const roomMatch = cls.room?.toLowerCase().includes(query);
      const teacherMatch = cls.teacher?.toLowerCase().includes(query);
      const cohortMatch = cls.program?.toLowerCase().includes(query);
      
      return nameMatch || codeMatch || roomMatch || teacherMatch || cohortMatch;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleOpenDetail = (cls) => {
    setSelectedClass(cls);
    setModalVisible(true);
  };

  return (
    <View style={[s.container, { paddingTop: 20 }]}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={s.title}>Weekly Grid</Text>
        <Text style={s.subtitle}>
          Browse your complete weekly calendar and query classroom allocations
        </Text>
      </View>

      {/* Dynamic Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchWrapper, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
          <Ionicons name="search" size={18} color={c.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[s.bodyText, styles.searchInput]}
            placeholder="Search by course code, room, or faculty..."
            placeholderTextColor={c.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Day Tabs list */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollTabs}>
          {weekdays.map((day) => {
            const isSelected = selectedDay === day;
            const count = classes.filter(cls => cls.day === day).length;
            
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.tabButton,
                  { backgroundColor: c.bgSecondary, borderColor: c.glassBorder },
                  isSelected && { backgroundColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary, borderColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[
                  styles.tabText,
                  { color: isSelected ? '#ffffff' : c.textSecondary }
                ]}>
                  {day.substring(0, 3)}
                </Text>
                {count > 0 && (
                  <View style={[styles.badge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : c.bgTertiary }]}>
                    <Text style={[styles.badgeText, { color: isSelected ? '#ffffff' : c.textPrimary }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Vertical schedule timeline */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {filteredClasses.length === 0 ? (
          <View style={[s.glassCard, styles.emptyStateCard]}>
            <Ionicons name="calendar-outline" size={40} color={c.textMuted} />
            <Text style={[s.bodyText, { fontWeight: '700', marginTop: 12 }]}>No Matches Found</Text>
            <Text style={[s.mutedText, { fontSize: 13, marginTop: 4, textAlign: 'center' }]}>
              {searchQuery 
                ? `No classes matching "${searchQuery}" scheduled for ${selectedDay}.`
                : `There are no scheduled lectures listed for ${selectedDay} in your timetable.`}
            </Text>
          </View>
        ) : (
          filteredClasses.map((cls, index) => (
            <TouchableOpacity
              key={cls.classId || `cls-${index}`}
              style={[s.glassCard, styles.classItem, { borderColor: c.glassBorder }]}
              onPress={() => handleOpenDetail(cls)}
            >
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.bodyText, { fontWeight: '800', fontSize: 16 }]} numberOfLines={1}>
                    {cls.name}
                  </Text>
                  <Text style={[s.mutedText, { fontSize: 12, marginTop: 2 }]}>
                    Code: {cls.code}
                  </Text>
                </View>
                
                {/* Time range slot */}
                <View style={[styles.timeBadge, { backgroundColor: user?.role === 'teacher' ? c.accentSecondary + '10' : c.accentPrimary + '10' }]}>
                  <Text style={[styles.timeBadgeText, { color: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }]}>
                    {cls.startTime}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDetailsDivider} />

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Ionicons name="location-outline" size={14} color={c.textSecondary} />
                  <Text style={[styles.metaValue, { color: c.textSecondary }]} numberOfLines={1}>
                    {cls.room}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Ionicons name={user?.role === 'teacher' ? 'people-outline' : 'person-outline'} size={14} color={c.textSecondary} />
                  <Text style={[styles.metaValue, { color: c.textSecondary }]} numberOfLines={1}>
                    {user?.role === 'teacher' ? `${cls.program} (Sem ${cls.semester})` : cls.teacher}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Premium Glassmorphic Detail Modal */}
      {selectedClass && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconBox, { backgroundColor: user?.role === 'teacher' ? c.accentSecondary + '1A' : c.accentPrimary + '1A' }]}>
                  <Ionicons name="easel" size={24} color={user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary} />
                </View>
                <Text style={[s.bodyText, styles.modalCourseCode]}>#{selectedClass.code}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <Text style={[s.bodyText, styles.modalTitle]}>
                {selectedClass.name}
              </Text>

              {/* Grid details */}
              <View style={styles.modalDetailGrid}>
                {/* Room */}
                <View style={[styles.gridCell, { backgroundColor: c.inputBg, borderColor: c.glassBorder }]}>
                  <Ionicons name="location" size={16} color={c.textSecondary} />
                  <Text style={[styles.gridCellLabel, { color: c.textMuted }]}>Room Allocation</Text>
                  <Text style={[s.bodyText, styles.gridCellValue]} numberOfLines={2}>
                    {selectedClass.room}
                  </Text>
                </View>

                {/* Day / Time */}
                <View style={[styles.gridCell, { backgroundColor: c.inputBg, borderColor: c.glassBorder }]}>
                  <Ionicons name="time" size={16} color={c.textSecondary} />
                  <Text style={[styles.gridCellLabel, { color: c.textMuted }]}>Duration & Day</Text>
                  <Text style={[s.bodyText, styles.gridCellValue]}>
                    {selectedClass.day}
                  </Text>
                  <Text style={[s.bodyText, { fontWeight: '700', fontSize: 13, color: c.accentPrimary, marginTop: 2 }]}>
                    {selectedClass.startTime} - {selectedClass.endTime}
                  </Text>
                </View>

                {/* Teacher / Faculty */}
                <View style={[styles.gridCell, { backgroundColor: c.inputBg, borderColor: c.glassBorder, flexBasis: '100%' }]}>
                  <Ionicons name="person" size={16} color={c.textSecondary} />
                  <Text style={[styles.gridCellLabel, { color: c.textMuted }]}>Assigned Faculty</Text>
                  <Text style={[s.bodyText, styles.gridCellValue]}>
                    {selectedClass.teacher}
                  </Text>
                </View>

                {/* Academic Cohort */}
                <View style={[styles.gridCell, { backgroundColor: c.inputBg, borderColor: c.glassBorder, flexBasis: '100%' }]}>
                  <Ionicons name="school" size={16} color={c.textSecondary} />
                  <Text style={[styles.gridCellLabel, { color: c.textMuted }]}>Academic Cohort Targets</Text>
                  <Text style={[s.bodyText, styles.gridCellValue]}>
                    {selectedClass.program}
                  </Text>
                  <Text style={[s.mutedText, { fontSize: 12, marginTop: 2 }]}>
                    Semester {selectedClass.semester} ({selectedClass.type}) • Section {selectedClass.section || 'All'}
                  </Text>
                </View>
              </View>

              {/* Close Action */}
              <TouchableOpacity
                style={[s.btn, s.btnSecondary, { marginTop: 12 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.btnTextSecondary}>CLOSE WINDOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  tabsContainer: {
    marginBottom: 10,
  },
  scrollTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  classItem: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardDetailsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  metaValue: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalCourseCode: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 26,
  },
  modalDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  gridCell: {
    flex: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  gridCellLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  gridCellValue: {
    fontWeight: '700',
    fontSize: 13,
  }
});
