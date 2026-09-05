import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export const ONBOARDING_STORAGE_KEY = 'sheduos_onboarding_completed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingPageData {
  id: string;
  type: 'welcome' | 'timetables' | 'freerooms' | 'offline';
  badge: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  badgeColor: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
}

const ONBOARDING_PAGES: OnboardingPageData[] = [
  {
    id: 'screen_1',
    type: 'welcome',
    badge: 'UNIVERSITY OF SARGODHA',
    badgeIcon: 'school-outline',
    badgeColor: '#6366F1',
    title: 'Welcome to ShedUOS',
    subtitle: 'Official timetable and classroom schedule assistant for University of Sargodha students and faculty.',
    primaryButtonText: 'Get Started',
  },
  {
    id: 'screen_2',
    type: 'timetables',
    badge: 'ACADEMIC SCHEDULES',
    badgeIcon: 'calendar-outline',
    badgeColor: '#6366F1',
    title: 'Personalized Timetables',
    subtitle: 'Tailored schedules for your exact semester, department, batch, and section with live period tracking.',
    primaryButtonText: 'Next',
  },
  {
    id: 'screen_3',
    type: 'freerooms',
    badge: 'FREE ROOM FINDER',
    badgeIcon: 'search-outline',
    badgeColor: '#10B981',
    title: 'Free Room Finder',
    subtitle: 'Discover unoccupied lecture halls, computer laboratories, and classrooms across departments.',
    primaryButtonText: 'Next',
  },
  {
    id: 'screen_4',
    type: 'offline',
    badge: 'OFFLINE FIRST',
    badgeIcon: 'cloud-offline-outline',
    badgeColor: '#F59E0B',
    title: 'Offline Ready',
    subtitle: 'Access your complete weekly schedule and campus routines anytime, anywhere — even without an internet connection.',
    primaryButtonText: 'Get Started',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingPageData>>(null);

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore storage error
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex !== currentIndex && pageIndex >= 0 && pageIndex < ONBOARDING_PAGES.length) {
      setCurrentIndex(pageIndex);
    }
  };

  const renderScreenIllustration = (type: OnboardingPageData['type']) => {
    switch (type) {
      case 'welcome':
        return (
          <View style={styles.heroIllustrationBox}>
            {/* Ambient Multi-Ring Glow */}
            <View style={[styles.glowRingOuter, { borderColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.12)' }]}>
              <View style={[styles.glowRingInner, { borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 70, 229, 0.25)', backgroundColor: isDark ? 'rgba(99, 102, 241, 0.06)' : 'rgba(79, 70, 229, 0.04)' }]}>
                <View style={[styles.crestContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                  <Image
                    source={require('../../../assets/uos.png')}
                    style={styles.crestImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            {/* Quick feature pill tags under crest */}
            <View style={styles.quickPillsRow}>
              <View style={[styles.featureMicroChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="sparkles" size={11} color={colors.primaryLight} style={{ marginRight: 4 }} />
                <Text style={[styles.featureMicroText, { color: colors.textSecondary }]}>Daily Schedule</Text>
              </View>
              <View style={[styles.featureMicroChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="flash" size={11} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.featureMicroText, { color: colors.textSecondary }]}>Free Rooms</Text>
              </View>
              <View style={[styles.featureMicroChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="shield-checkmark" size={11} color={colors.gold} style={{ marginRight: 4 }} />
                <Text style={[styles.featureMicroText, { color: colors.textSecondary }]}>Offline Access</Text>
              </View>
            </View>
          </View>
        );

      case 'timetables':
        return (
          <View style={styles.heroIllustrationBox}>
            <View style={[styles.illustrationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {/* Mock Timetable Card Header */}
              <View style={styles.mockHeader}>
                <View style={styles.mockHeaderLeft}>
                  <View style={[styles.mockIconCircle, { backgroundColor: colors.badgeBg }]}>
                    <Ionicons name="calendar" size={14} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.mockHeaderTitle, { color: colors.textPrimary }]}>CS-6th-Morning</Text>
                    <Text style={[styles.mockHeaderSub, { color: colors.textSecondary }]}>Section A • Fall 2025</Text>
                  </View>
                </View>
                <View style={[styles.liveStatusPill, { backgroundColor: colors.badgeBg, borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.25)' }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.liveStatusText, { color: colors.primaryLight }]}>ACTIVE</Text>
                </View>
              </View>

              {/* Slot Row 1 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={[styles.slotColorBar, { backgroundColor: colors.primary }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>Mobile Application Dev</Text>
                    <Text style={[styles.slotTime, { color: colors.primaryLight }]}>09:00 - 10:30</Text>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Lab 03 • CS Dept</Text>
                    <Text style={[styles.slotMetaDivider, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Sir Imran</Text>
                  </View>
                </View>
              </View>

              {/* Slot Row 2 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={[styles.slotColorBar, { backgroundColor: colors.purple }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>Artificial Intelligence</Text>
                    <Text style={[styles.slotTime, { color: colors.purpleLight }]}>10:30 - 12:00</Text>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="business-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Room 14 • Main Block</Text>
                    <Text style={[styles.slotMetaDivider, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Dr. Usman</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Floating Tag */}
            <View style={[styles.floatingTag, { backgroundColor: colors.primaryDark, borderColor: colors.primary }]}>
              <Ionicons name="time" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.floatingTagText}>Current Period Tracking</Text>
            </View>
          </View>
        );

      case 'freerooms':
        return (
          <View style={styles.heroIllustrationBox}>
            <View style={[styles.illustrationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {/* Mock Free Room Header */}
              <View style={styles.mockHeader}>
                <View style={styles.mockHeaderLeft}>
                  <View style={[styles.mockIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)' }]}>
                    <Ionicons name="search" size={14} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[styles.mockHeaderTitle, { color: colors.textPrimary }]}>Free Room Finder</Text>
                    <Text style={[styles.mockHeaderSub, { color: colors.textSecondary }]}>Currently Unoccupied</Text>
                  </View>
                </View>
                <View style={[styles.liveStatusPill, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.liveStatusText, { color: colors.success }]}>14 FREE</Text>
                </View>
              </View>

              {/* Room Row 1 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={[styles.slotColorBar, { backgroundColor: colors.success }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>CS Lab 02</Text>
                    <View style={[styles.freeTagPill, { backgroundColor: colors.successBg }]}>
                      <Text style={[styles.freeTagText, { color: colors.success }]}>Available 2 hrs</Text>
                    </View>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="hardware-chip-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>45 Systems • Air Conditioned</Text>
                  </View>
                </View>
              </View>

              {/* Room Row 2 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={[styles.slotColorBar, { backgroundColor: colors.success }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>Lecture Hall 05</Text>
                    <View style={[styles.freeTagPill, { backgroundColor: colors.successBg }]}>
                      <Text style={[styles.freeTagText, { color: colors.success }]}>Free until 01:00</Text>
                    </View>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="easel-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Multimedia • 80 Seats</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Floating Tag */}
            <View style={[styles.floatingTag, { backgroundColor: isDark ? '#059669' : '#047857', borderColor: colors.success }]}>
              <Ionicons name="radio" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.floatingTagText}>Schedule-Based Room Availability</Text>
            </View>
          </View>
        );

      case 'offline':
        return (
          <View style={styles.heroIllustrationBox}>
            <View style={[styles.illustrationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {/* Mock Offline Header */}
              <View style={styles.mockHeader}>
                <View style={styles.mockHeaderLeft}>
                  <View style={[styles.mockIconCircle, { backgroundColor: colors.goldBg }]}>
                    <Ionicons name="cloud-offline" size={14} color={colors.gold} />
                  </View>
                  <View>
                    <Text style={[styles.mockHeaderTitle, { color: colors.textPrimary }]}>Offline Timetable</Text>
                    <Text style={[styles.mockHeaderSub, { color: colors.textSecondary }]}>Local Offline Storage</Text>
                  </View>
                </View>
                <View style={[styles.liveStatusPill, { backgroundColor: colors.goldBg, borderColor: colors.goldBorder }]}>
                  <Ionicons name="checkmark-circle" size={11} color={colors.gold} style={{ marginRight: 3 }} />
                  <Text style={[styles.liveStatusText, { color: colors.gold }]}>CACHED</Text>
                </View>
              </View>

              {/* Offline Row 1 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={[styles.slotColorBar, { backgroundColor: colors.gold }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>Full Weekly Timetable</Text>
                    <Ionicons name="flash" size={13} color={colors.gold} />
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="speedometer-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Instant schedule access without internet</Text>
                  </View>
                </View>
              </View>

              {/* Offline Row 2 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={[styles.slotColorBar, { backgroundColor: colors.primary }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>Automatic Schedule Sync</Text>
                    <Ionicons name="sync-circle" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: colors.textSecondary }]}>Auto updates when network is available</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Floating Tag */}
            <View style={[styles.floatingTag, { backgroundColor: isDark ? '#D97706' : '#B45309', borderColor: colors.gold }]}>
              <Ionicons name="infinite" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.floatingTagText}>Full offline access to cached schedules</Text>
            </View>
          </View>
        );
    }
  };

  const renderPage = ({ item }: { item: OnboardingPageData }) => {
    return (
      <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
        <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Illustration Box */}
          {renderScreenIllustration(item.type)}

          {/* Badge */}
          <View
            style={[
              styles.screenBadge,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
                borderColor: item.badgeColor + '40',
              },
            ]}
          >
            <Ionicons name={item.badgeIcon} size={11} color={item.badgeColor} style={{ marginRight: 5 }} />
            <Text style={[styles.screenBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
          </View>

          {/* Heading and Subtitle */}
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 4,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {/* 1. Header Bar: Back (on screens 2-4), Branding & Skip */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {currentIndex > 0 ? (
            <Pressable
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleBack}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            </Pressable>
          ) : (
            <View
              style={[
                styles.brandPill,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 70, 229, 0.25)',
                },
              ]}
            >
              <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.brandTag, { color: colors.primary }]}>SHEDUOS</Text>
            </View>
          )}

          {currentIndex > 0 && (
            <View
              style={[
                styles.brandPill,
                {
                  marginLeft: 8,
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 70, 229, 0.25)',
                },
              ]}
            >
              <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.brandTag, { color: colors.primary }]}>SHEDUOS</Text>
            </View>
          )}
        </View>

        <View style={styles.topActions}>
          <Pressable
            style={[
              styles.skipBtn,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
            onPress={handleFinish}
            hitSlop={8}
          >
            <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>Skip</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Horizontal Paged Screen Slider */}
      <View style={styles.sliderWrapper}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_PAGES}
          renderItem={renderPage}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleScroll}
          decelerationRate="fast"
          scrollEventThrottle={16}
        />
      </View>

      {/* 3. Bottom Controls: Progress Indicator Dots & Gradient Action Button */}
      <View style={styles.bottomControls}>
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_PAGES.map((page, index) => {
            const isActive = index === currentIndex;
            return (
              <Pressable
                key={page.id}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                  });
                }}
                hitSlop={6}
              >
                <View
                  style={[
                    styles.dot,
                    isActive
                      ? [styles.activeDot, { backgroundColor: colors.primary }]
                      : [
                          styles.inactiveDot,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.16)'
                              : 'rgba(0, 0, 0, 0.12)',
                          },
                        ],
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Primary Action Button (Min Height 50dp >= 48dp) */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryActionButton,
            {
              backgroundColor: colors.buttonGradientStart,
              borderColor: colors.primaryDark,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
          onPress={handleNext}
        >
          <View style={styles.buttonInnerGradient}>
            <Text style={styles.primaryActionText}>
              {ONBOARDING_PAGES[currentIndex].primaryButtonText}
            </Text>
            <Ionicons
              name={currentIndex === ONBOARDING_PAGES.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
              size={18}
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          </View>
        </Pressable>

        {/* Subtle Footer Note */}
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          ShedUOS • Official Student & Faculty Platform
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 4,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginRight: 6,
  },
  brandTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#6366F1',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  skipBtn: {
    paddingHorizontal: 13,
    paddingVertical: 5.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  sliderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mainCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  heroIllustrationBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  glowRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  glowRingInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestContainer: {
    width: 82,
    height: 82,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  crestImage: {
    width: '100%',
    height: '100%',
  },
  quickPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  featureMicroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  featureMicroText: {
    fontSize: 10,
    fontWeight: '700',
  },
  illustrationCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  mockHeaderSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  liveStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mockScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 9,
    overflow: 'hidden',
  },
  slotColorBar: {
    width: 3.5,
    height: '100%',
    borderRadius: 2,
    marginRight: 8,
  },
  slotContent: {
    flex: 1,
  },
  slotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  slotSubject: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  slotTime: {
    fontSize: 10,
    fontWeight: '700',
  },
  slotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotMetaText: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  slotMetaDivider: {
    marginHorizontal: 4,
    fontSize: 8,
  },
  freeTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  floatingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  screenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
    marginBottom: 8,
  },
  screenBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    width: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveDot: {
    width: 7,
  },
  primaryActionButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  buttonInnerGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm + 1,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
});
