// Compact Dashboard Screen with PDF Upload for UOS Timetable Mobile App
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
import * as DocumentPicker from 'expo-document-picker';
import { useMobileStore } from '../store/useMobileStore';
import { COLORS, COMMON_STYLES } from '../components/Theme';

export default function DashboardScreen() {
  const user = useMobileStore((state) => state.user);
  const classes = useMobileStore((state) => state.classes) || [];
  const pdfFileName = useMobileStore((state) => state.pdfFileName);
  const isOnline = useMobileStore((state) => state.isOnline);
  const forceSync = useMobileStore((state) => state.forceSync);
  const uploadPdf = useMobileStore((state) => state.uploadPdf);
  const theme = useMobileStore((state) => state.themeMode);
  
  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  const getTodayDay = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[new Date().getDay()];
    return (currentDay === 'Saturday' || currentDay === 'Sunday') ? 'Monday' : currentDay;
  };

  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [currentTimeString, setCurrentTimeString] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeString(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const dayClasses = classes
    .filter((cls) => cls.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getNextClass = () => {
    const today = getTodayDay();
    const todayAllClasses = classes
      .filter((cls) => cls.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return todayAllClasses.find((cls) => cls.startTime > currentTimeString) || null;
  };

  const isClassOngoing = (cls) => {
    const today = getTodayDay();
    if (cls.day !== today) return false;
    return currentTimeString >= cls.startTime && currentTimeString <= cls.endTime;
  };

  const nextClass = getNextClass();
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline Mode', 'Cannot synchronize while offline.');
      return;
    }
    setSyncing(true);
    try {
      await forceSync();
      Alert.alert('Sync Successful', 'Your timetable has been updated!');
    } catch (error) {
      Alert.alert('Sync Failed', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      setUploading(true);
      const res = await uploadPdf(file.uri, file.name, file.mimeType);
      Alert.alert(
        '✅ Upload Successful',
        `Timetable parsed! ${res.classCount} lecture slots loaded into your schedule.`
      );
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Could not upload the PDF.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Compact Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.bodyText, { fontSize: 14, opacity: 0.7 }]}>Assalam-o-Alaikum,</Text>
          <Text style={[s.title, { fontSize: 22, marginBottom: 0, color: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }]}>
            {user?.role === 'teacher' ? 'Prof. ' : ''}{user?.fullName || 'User'}!
          </Text>
        </View>
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

      {/* PDF Upload / Active Timetable Card */}
      {pdfFileName ? (
        /* Active timetable — compact status row */
        <View style={[styles.uploadCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
          <View style={[styles.uploadIconBox, { backgroundColor: c.success + '15' }]}>
            <Ionicons name="document-text" size={20} color={c.success} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.mutedText, { fontSize: 10, marginBottom: 1 }]}>Active Timetable</Text>
            <Text style={[s.bodyText, { fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>{pdfFileName}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: c.bgTertiary, borderColor: c.glassBorder }]}
              onPress={handleUploadPdf}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={c.accentPrimary} />
              ) : (
                <Ionicons name="cloud-upload" size={16} color={c.accentPrimary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: c.bgTertiary, borderColor: c.glassBorder }]}
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
        </View>
      ) : (
        /* No timetable — prominent upload area */
        <TouchableOpacity
          style={[styles.uploadAreaCard, { backgroundColor: c.bgSecondary, borderColor: c.accentPrimary + '40' }]}
          onPress={handleUploadPdf}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <View style={styles.uploadAreaContent}>
              <ActivityIndicator size="large" color={c.accentPrimary} />
              <Text style={[s.bodyText, { fontWeight: '700', marginTop: 10 }]}>Uploading & Parsing...</Text>
              <Text style={[s.mutedText, { fontSize: 11, marginTop: 2 }]}>Extracting your lecture schedule from PDF</Text>
            </View>
          ) : (
            <View style={styles.uploadAreaContent}>
              <View style={[styles.uploadCircle, { backgroundColor: c.accentPrimary + '15' }]}>
                <Ionicons name="cloud-upload-outline" size={28} color={c.accentPrimary} />
              </View>
              <Text style={[s.bodyText, { fontWeight: '700', marginTop: 10, fontSize: 15 }]}>Upload Timetable PDF</Text>
              <Text style={[s.mutedText, { fontSize: 11, marginTop: 2, textAlign: 'center' }]}>
                Select the official UOS timetable PDF to auto-parse your schedule
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Next Class Banner */}
      {nextClass ? (
        <LinearGradient
          colors={user?.role === 'teacher' ? ['#1e1b4b', '#311042'] : ['#0b1532', '#160938']}
          style={[styles.nextClassCard, { borderColor: user?.role === 'teacher' ? c.accentSecondary + '50' : c.accentPrimary + '50' }]}
        >
          <View style={styles.nextClassHeader}>
            <View style={[styles.alertBadge, { backgroundColor: user?.role === 'teacher' ? c.accentSecondary + '2A' : c.accentPrimary + '2A' }]}>
              <Ionicons name="sparkles" size={12} color={user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary} />
              <Text style={[styles.alertBadgeText, { color: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }]}>
                Next Lecture
              </Text>
            </View>
            <Text style={[s.mutedText, { color: 'rgba(255,255,255,0.7)', fontSize: 11 }]}>
              {nextClass.startTime}
            </Text>
          </View>
          <Text style={styles.nextClassName} numberOfLines={1}>{nextClass.name}</Text>
          <View style={styles.nextClassDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={12} color="#ffffff" style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>{nextClass.room}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name={user?.role === 'teacher' ? 'people' : 'person'} size={12} color="#ffffff" style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {user?.role === 'teacher' ? `${nextClass.program} (${nextClass.type})` : nextClass.teacher}
              </Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.relaxCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
          <Ionicons name="happy" size={22} color={c.success} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[s.bodyText, { fontWeight: '700', fontSize: 14 }]}>No More Classes Today</Text>
            <Text style={[s.mutedText, { fontSize: 11 }]}>Rest and prepare for your next day!</Text>
          </View>
        </View>
      )}

      {/* Day Selector — inline row */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.weekdayScrollView}
        contentContainerStyle={styles.weekdayRow}
      >
        {weekdays.map((day) => {
          const isSelected = selectedDay === day;
          const count = classes.filter(cls => cls.day === day).length;
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
              <Text style={[styles.dayButtonText, { color: isSelected ? '#ffffff' : c.textSecondary }]}>
                {day.substring(0, 3)}
              </Text>
              {count > 0 && (
                <View style={[styles.dayBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : c.bgTertiary }]}>
                  <Text style={[styles.dayBadgeText, { color: isSelected ? '#fff' : c.textMuted }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day Schedule timeline */}
      <View style={[s.glassCard, { paddingVertical: 12, paddingHorizontal: 14 }]}>
        <View style={styles.timelineHeader}>
          <Text style={[s.bodyText, { fontWeight: '700', fontSize: 15 }]}>
            {selectedDay}
          </Text>
          <Text style={[s.mutedText, { fontSize: 11 }]}>
            {currentTimeString}
          </Text>
        </View>

        {dayClasses.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Ionicons name="cafe" size={26} color={c.textMuted} />
            <Text style={[s.mutedText, { marginTop: 6, fontSize: 13 }]}>
              No lectures for {selectedDay}.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineList}>
            {dayClasses.map((cls, index) => {
              const ongoing = isClassOngoing(cls);
              return (
                <View key={cls.classId || `cls-${index}`} style={styles.timelineItem}>
                  <View style={styles.timelineDotColumn}>
                    <View style={[
                      styles.dot, 
                      { backgroundColor: c.bgTertiary, borderColor: c.glassBorder },
                      ongoing && { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary }
                    ]} />
                    {index < dayClasses.length - 1 && <View style={[styles.line, { backgroundColor: c.bgTertiary }]} />}
                  </View>
                  <View style={[
                    styles.classCard,
                    { backgroundColor: c.inputBg, borderColor: c.glassBorder },
                    ongoing && { borderColor: c.accentPrimary, backgroundColor: c.bgTertiary }
                  ]}>
                    <View style={styles.cardHeader}>
                      <Text style={[s.bodyText, { fontWeight: '700', flex: 1, fontSize: 13 }]} numberOfLines={1}>
                        {cls.name}
                      </Text>
                      <Text style={[s.mutedText, { fontSize: 10 }]}>#{cls.code}</Text>
                    </View>
                    <View style={styles.cardDetailRow}>
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="time" size={11} color={c.textSecondary} style={{ marginRight: 3 }} />
                        <Text style={[s.mutedText, { fontSize: 11 }]}>
                          {cls.startTime} - {cls.endTime}
                        </Text>
                      </View>
                      <View style={[styles.cardMetaItem, { flex: 1, flexShrink: 1, marginRight: 0 }]}>
                        <Ionicons name="location" size={11} color={c.textSecondary} style={{ marginRight: 3 }} />
                        <Text style={[s.mutedText, { fontSize: 11, flex: 1 }]} numberOfLines={1}>
                          {cls.room}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cardMetaItem, { flex: 1, flexShrink: 1, marginRight: 0, marginTop: 4 }]}>
                      <Ionicons name={user?.role === 'teacher' ? 'people' : 'person'} size={11} color={c.textSecondary} style={{ marginRight: 3 }} />
                      <Text style={[s.mutedText, { fontSize: 11, flex: 1 }]} numberOfLines={1}>
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
    paddingTop: 35,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // Upload card — when timetable is active
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  uploadIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Upload area — when no timetable
  uploadAreaCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  uploadAreaContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Next class card
  nextClassCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 3,
  },
  nextClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  alertBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  nextClassName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  nextClassDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  detailIcon: {
    marginRight: 5,
    opacity: 0.8,
  },
  detailText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
  },
  // Relax card
  relaxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  // Day selector
  weekdayScrollView: {
    marginHorizontal: -20,
    marginBottom: 14,
  },
  weekdayRow: {
    gap: 7,
    paddingHorizontal: 20,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayBadge: {
    marginLeft: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  // Timeline
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTimeline: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineList: {},
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timelineDotColumn: {
    alignItems: 'center',
    marginRight: 10,
    width: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 5,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 3,
  },
  classCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDetailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginVertical: 1,
  }
});
