// Premium Glassmorphic Profile Settings, Device API Configuration & Offline Cache Controller
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileStore } from '../store/useMobileStore';
import { COLORS, COMMON_STYLES } from '../components/Theme';

export default function ProfileScreen() {
  const user = useMobileStore((state) => state.user);
  const classes = useMobileStore((state) => state.classes) || [];
  const token = useMobileStore((state) => state.token);
  const apiUrl = useMobileStore((state) => state.apiUrl);
  const theme = useMobileStore((state) => state.themeMode);
  const syncTimestamp = useMobileStore((state) => state.syncTimestamp);

  const setApiUrl = useMobileStore((state) => state.setApiUrl);
  const logout = useMobileStore((state) => state.logout);
  const toggleTheme = useMobileStore((state) => state.toggleTheme);
  const updateProfile = useMobileStore((state) => state.updateProfile);

  const c = COLORS[theme];
  const s = COMMON_STYLES(theme);

  // Edit fields state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  
  // Student cohort states
  const [program, setProgram] = useState(user?.program || 'BS in Software Engineering');
  const [type, setType] = useState(user?.type || 'Regular');
  const [batch, setBatch] = useState(user?.batch || '2024-2028');
  const [semester, setSemester] = useState(String(user?.semester || '2'));

  const [saving, setSaving] = useState(false);

  // Dropdown open states
  const [programDropdownOpen, setProgramDropdownOpen] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const programs = [
    'BS in Software Engineering',
    'BS in Computer Science',
    'BS in Information Technology',
    'MS in Software Engineering'
  ];
  const types = ['Regular', 'Self Support 1', 'Self Support 2'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const getProgramLabel = (name) => {
    if (name === 'BS in Software Engineering') return 'BS Software Eng.';
    if (name === 'BS in Computer Science') return 'BS Computer Sci.';
    if (name === 'BS in Information Technology') return 'BS Info. Tech.';
    if (name === 'MS in Software Engineering') return 'MS Software Eng.';
    return name;
  };

  const handleSaveProfile = async () => {
    if (!fullName) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    if (user?.role === 'student' && !/^\d{4}-\d{4}$/.test(batch)) {
      Alert.alert('Invalid Session Format', 'Session batch must be in YYYY-YYYY format.');
      return;
    }

    setSaving(true);
    try {
      // Save local IP URL configuration
      setApiUrl(localApiUrl);

      const profilePayload = { fullName };
      if (user?.role === 'student') {
        profilePayload.program = program;
        profilePayload.type = type;
        profilePayload.batch = batch;
        profilePayload.semester = Number(semester);
      }

      const res = await updateProfile(profilePayload);
      Alert.alert(
        res.offline ? 'Saved Locally' : 'Success',
        res.message || 'Your academic coordinates and profile settings have been updated.'
      );
    } catch (error) {
      Alert.alert('Save Failed', error.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Reset Storage',
      'This will erase all cached lecture timetables and credentials stored locally. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            logout(); // log out and clear Zustand storage
            Alert.alert('Cache Reset', 'All cached application data has been successfully cleared.');
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to end your current timetable session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Profile Header Avatar Card */}
      <View style={[s.glassCard, styles.avatarCard, { backgroundColor: c.bgSecondary }]}>
        <View style={[styles.avatarBox, { backgroundColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }]}>
          <Text style={styles.avatarLetter}>
            {user?.fullName ? user.fullName.substring(0, 1).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={[s.bodyText, styles.profileName]}>{user?.fullName || 'Academic User'}</Text>
        <Text style={[s.mutedText, styles.profileEmail]}>{user?.email || 'user@uos.edu.pk'}</Text>
        
        <View style={[
          styles.roleBadge,
          { backgroundColor: user?.role === 'teacher' ? c.accentSecondary + '20' : c.accentPrimary + '20', borderColor: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }
        ]}>
          <Text style={[styles.roleBadgeText, { color: user?.role === 'teacher' ? c.accentSecondary : c.accentPrimary }]}>
            {user?.role === 'teacher' ? 'Faculty Instructor' : 'University Student'}
          </Text>
        </View>
      </View>

      {/* Global Interface Theme Selector */}
      <View style={[s.glassCard, styles.themeSelectorCard, { backgroundColor: c.bgSecondary }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.bodyText, { fontWeight: '700' }]}>Appearance Settings</Text>
          <Text style={[s.mutedText, { fontSize: 12 }]}>
            Current Theme: {theme === 'dark' ? 'Deep Space Dark' : 'Harmonious Light'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.themeToggleBtn, { backgroundColor: c.bgTertiary, borderColor: c.glassBorder }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={theme === 'dark' ? 'sunny' : 'moon'}
            size={18}
            color={theme === 'dark' ? c.warning : c.accentPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* User Information & Academic Settings Card */}
      <View style={s.glassCard}>
        <Text style={[s.inputLabel, { marginBottom: 16 }]}>Personal Information</Text>

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Full Name</Text>
          <TextInput
            style={[s.inputField, s.bodyText]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Dr. Afzal Badshah"
            placeholderTextColor={c.textMuted}
          />
        </View>

        {user?.role === 'student' && (
          <View style={{ width: '100%' }}>
            {/* Program selection Dropdown */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Degree Program Coordinates</Text>
              <TouchableOpacity
                style={[styles.dropdownSelect, { backgroundColor: c.inputBg, borderColor: c.glassBorder }]}
                onPress={() => setProgramDropdownOpen(true)}
              >
                <Ionicons name="school" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
                <Text style={[s.bodyText, { flex: 1, fontSize: 13, color: program ? c.textPrimary : c.textMuted }]}>
                  {program ? getProgramLabel(program) : 'Select Degree Program'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Batch session */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Session / Batch Year</Text>
              <TextInput
                style={[s.inputField, s.bodyText]}
                value={batch}
                onChangeText={setBatch}
                placeholder="2024-2028"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
              />
            </View>

            {/* Semester selector Dropdown */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Current Academic Semester</Text>
              <TouchableOpacity
                style={[styles.dropdownSelect, { backgroundColor: c.inputBg, borderColor: c.glassBorder }]}
                onPress={() => setSemesterDropdownOpen(true)}
              >
                <Ionicons name="calendar" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
                <Text style={[s.bodyText, { flex: 1, fontSize: 13, color: semester ? c.textPrimary : c.textMuted }]}>
                  {semester ? `Semester ${semester}` : 'Select Semester'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Admission Type (Support Category) */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Academic Support Program</Text>
              <View style={styles.supportRow}>
                {types.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.supportBadge,
                      { backgroundColor: c.bgTertiary, borderColor: c.glassBorder },
                      type === t && { backgroundColor: c.accentGlow, borderColor: c.accentPrimary }
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.supportText, { color: type === t ? c.accentPrimary : c.textSecondary }]}>
                      {t === 'Self Support 1' ? 'Self 1' : t === 'Self Support 2' ? 'Self 2' : t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, s.btnPrimary, { marginTop: 10 }]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          <Text style={s.btnTextPrimary}>SAVE CHANGES</Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Settings Expandable Header */}
      <TouchableOpacity
        style={[
          s.glassCard,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: c.bgSecondary,
            borderColor: c.glassBorder,
            marginBottom: 16,
          }
        ]}
        onPress={() => setShowAdvanced(!showAdvanced)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name="settings-outline" 
            size={18} 
            color={showAdvanced ? c.accentPrimary : c.textSecondary} 
            style={{ marginRight: 10 }} 
          />
          <Text style={[s.bodyText, { fontWeight: '700', fontSize: 14 }]}>
            Advanced Settings
          </Text>
        </View>
        <Ionicons 
          name={showAdvanced ? "chevron-up" : "chevron-down"} 
          size={18} 
          color={c.textSecondary} 
        />
      </TouchableOpacity>

      {showAdvanced && (
        <>
          {/* Network Configuration IP customization */}
          <View style={s.glassCard}>
            <Text style={[s.inputLabel, { marginBottom: 10 }]}>Physical Device API Loopback</Text>
            <Text style={[s.mutedText, { fontSize: 11, marginBottom: 12 }]}>
              When deploying to an actual phone, enter your laptop's Local IP address (e.g. http://192.168.1.100:3000/api) to sync live.
            </Text>
            <TextInput
              style={[s.inputField, s.bodyText, { marginBottom: 12 }]}
              value={localApiUrl}
              onChangeText={setLocalApiUrl}
              placeholder="http://10.0.2.2:3000/api"
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[s.btn, s.btnSecondary]}
              onPress={handleSaveProfile}
            >
              <Text style={s.btnTextSecondary}>UPDATE SERVER GATEWAY</Text>
            </TouchableOpacity>
          </View>

          {/* Storage & Local Cache Controls Card */}
          <View style={[s.glassCard, { borderColor: c.danger + '40', marginBottom: 16 }]}>
            <Text style={[s.inputLabel, { color: c.danger, marginBottom: 12 }]}>Offline SQLite Cache Controls</Text>
            
            <View style={styles.dbStatRow}>
              <Text style={s.bodyText}>Synchronized Lectures</Text>
              <View style={[styles.statBadge, { backgroundColor: c.bgTertiary }]}>
                <Text style={[s.bodyText, { fontWeight: '700', fontSize: 12 }]}>{classes.length} entries</Text>
              </View>
            </View>

            <View style={styles.dbStatRow}>
              <Text style={s.bodyText}>Zustand Storage Model</Text>
              <Text style={s.mutedText}>AsyncStorage Persist</Text>
            </View>

            <View style={styles.dbStatRow}>
              <Text style={s.bodyText}>Last Sync Timestamp</Text>
              <Text style={[s.mutedText, { fontSize: 11 }]} numberOfLines={1}>
                {syncTimestamp ? new Date(syncTimestamp).toLocaleTimeString() : 'Never'}
              </Text>
            </View>

            <TouchableOpacity
              style={[s.btn, s.btnSecondary, { borderColor: c.danger, marginTop: 12 }]}
              onPress={handleClearCache}
            >
              <Ionicons name="trash" size={16} color={c.danger} style={{ marginRight: 6 }} />
              <Text style={[s.btnTextSecondary, { color: c.danger }]}>RESET LOCAL CACHE</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Log Out action */}
      <TouchableOpacity
        style={[s.btn, s.btnPrimary, { backgroundColor: c.danger, shadowColor: c.danger, marginBottom: 30 }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={18} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={s.btnTextPrimary}>LOG OUT SESSION</Text>
      </TouchableOpacity>

      {/* Program Dropdown Modal Overlay */}
      <Modal
        visible={programDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProgramDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProgramDropdownOpen(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select Degree Program</Text>
            {programs.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.modalItem,
                  { borderBottomColor: c.glassBorder },
                  program === p && { backgroundColor: c.accentGlow }
                ]}
                onPress={() => {
                  setProgram(p);
                  setProgramDropdownOpen(false);
                }}
              >
                <Text style={[s.bodyText, { color: program === p ? c.accentPrimary : c.textPrimary, fontWeight: program === p ? '700' : '400' }]}>
                  {p}
                </Text>
                {program === p && <Ionicons name="checkmark" size={18} color={c.accentPrimary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Semester Dropdown Modal Overlay */}
      <Modal
        visible={semesterDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSemesterDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSemesterDropdownOpen(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: c.bgSecondary, borderColor: c.glassBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select Active Semester</Text>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {semesters.map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: c.glassBorder },
                    semester === sem && { backgroundColor: c.accentGlow }
                  ]}
                  onPress={() => {
                    setSemester(sem);
                    setSemesterDropdownOpen(false);
                  }}
                >
                  <Text style={[s.bodyText, { color: semester === sem ? c.accentPrimary : c.textPrimary, fontWeight: semester === sem ? '700' : '400' }]}>
                    Semester {sem}
                  </Text>
                  {semester === sem && <Ionicons name="checkmark" size={18} color={c.accentPrimary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 90,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 1,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 12,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  themeSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  semRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  semBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semText: {
    fontSize: 14,
    fontWeight: '700',
  },
  supportRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  supportBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dbStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  statBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dropdownSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  }
});
