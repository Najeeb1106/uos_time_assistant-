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
    subtitle: 'Your smart campus companion for automated timetables, schedule tracking, and instant free room discovery.',
    primaryButtonText: 'Get Started',
  },
  {
    id: 'screen_2',
    type: 'timetables',
    badge: 'SMART SCHEDULES',
    badgeIcon: 'calendar-outline',
    badgeColor: '#6366F1',
    title: 'Personalized Timetables',
    subtitle: 'Tailored schedules for your exact semester, department, batch, and section with live period tracking.',
    primaryButtonText: 'Next',
  },
  {
    id: 'screen_3',
    type: 'freerooms',
    badge: 'VACANCY RADAR',
    badgeIcon: 'search-outline',
    badgeColor: '#10B981',
    title: 'Free Room Finder',
    subtitle: 'Instantly discover unoccupied lecture halls, computer laboratories, and classrooms across campus in real time.',
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
  const { colors, isDark, toggleTheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingPageData>>(null);

  // Theme tokens matching the dark navy/indigo aesthetic
  const bgCanvas = isDark ? '#060814' : colors.background;
  const cardSurface = isDark ? '#0B0F24' : colors.surface;
  const cardElevated = isDark ? '#131936' : colors.surfaceElevated;
  const textTitle = isDark ? '#F8FAFC' : colors.textPrimary;
  const textSub = isDark ? '#94A3B8' : colors.textSecondary;
  const borderLine = isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border;
  const subtleBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : colors.borderSubtle;

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
            <View style={[styles.glowRingOuter, { borderColor: 'rgba(99, 102, 241, 0.12)' }]}>
              <View style={[styles.glowRingInner, { borderColor: 'rgba(99, 102, 241, 0.25)', backgroundColor: isDark ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.04)' }]}>
                <View style={[styles.crestContainer, { backgroundColor: cardElevated, borderColor: 'rgba(99, 102, 241, 0.4)' }]}>
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
              <View style={[styles.featureMicroChip, { backgroundColor: cardElevated, borderColor: borderLine }]}>
                <Ionicons name="sparkles" size={11} color="#818CF8" style={{ marginRight: 4 }} />
                <Text style={[styles.featureMicroText, { color: textSub }]}>Smart Routine</Text>
              </View>
              <View style={[styles.featureMicroChip, { backgroundColor: cardElevated, borderColor: borderLine }]}>
                <Ionicons name="flash" size={11} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={[styles.featureMicroText, { color: textSub }]}>Instant Vacancy</Text>
              </View>
              <View style={[styles.featureMicroChip, { backgroundColor: cardElevated, borderColor: borderLine }]}>
                <Ionicons name="shield-checkmark" size={11} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={[styles.featureMicroText, { color: textSub }]}>Offline Sync</Text>
              </View>
            </View>
          </View>
        );

      case 'timetables':
        return (
          <View style={styles.heroIllustrationBox}>
            <View style={[styles.illustrationCard, { backgroundColor: cardElevated, borderColor: borderLine }]}>
              {/* Mock Timetable Card Header */}
              <View style={styles.mockHeader}>
                <View style={styles.mockHeaderLeft}>
                  <View style={[styles.mockIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                    <Ionicons name="calendar" size={14} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={[styles.mockHeaderTitle, { color: textTitle }]}>CS-6th-Morning</Text>
                    <Text style={[styles.mockHeaderSub, { color: textSub }]}>Section A • Fall 2025</Text>
                  </View>
                </View>
                <View style={[styles.liveStatusPill, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#6366F1' }]} />
                  <Text style={[styles.liveStatusText, { color: '#818CF8' }]}>LIVE</Text>
                </View>
              </View>

              {/* Slot Row 1 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: isDark ? '#0B0F24' : '#FFFFFF', borderColor: subtleBorder }]}>
                <View style={[styles.slotColorBar, { backgroundColor: '#6366F1' }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: textTitle }]}>Mobile Application Dev</Text>
                    <Text style={[styles.slotTime, { color: '#818CF8' }]}>09:00 - 10:30</Text>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="location-outline" size={12} color={textSub} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: textSub }]}>Lab 03 • CS Dept</Text>
                    <Text style={[styles.slotMetaDivider, { color: textSub }]}>•</Text>
                    <Text style={[styles.slotMetaText, { color: textSub }]}>Sir Imran</Text>
                  </View>
                </View>
              </View>

              {/* Slot Row 2 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: isDark ? '#0B0F24' : '#FFFFFF', borderColor: subtleBorder }]}>
                <View style={[styles.slotColorBar, { backgroundColor: '#A855F7' }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: textTitle }]}>Artificial Intelligence</Text>
                    <Text style={[styles.slotTime, { color: '#A855F7' }]}>10:30 - 12:00</Text>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="business-outline" size={12} color={textSub} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: textSub }]}>Room 14 • Main Block</Text>
                    <Text style={[styles.slotMetaDivider, { color: textSub }]}>•</Text>
                    <Text style={[styles.slotMetaText, { color: textSub }]}>Dr. Usman</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Floating Tag */}
            <View style={[styles.floatingTag, { backgroundColor: '#1D4ED8', borderColor: '#3B82F6' }]}>
              <Ionicons name="time" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.floatingTagText}>Auto Day & Slot Detection</Text>
            </View>
          </View>
        );

      case 'freerooms':
        return (
          <View style={styles.heroIllustrationBox}>
            <View style={[styles.illustrationCard, { backgroundColor: cardElevated, borderColor: borderLine }]}>
              {/* Mock Free Room Header */}
              <View style={styles.mockHeader}>
                <View style={styles.mockHeaderLeft}>
                  <View style={[styles.mockIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Ionicons name="search" size={14} color="#10B981" />
                  </View>
                  <View>
                    <Text style={[styles.mockHeaderTitle, { color: textTitle }]}>Campus Room Radar</Text>
                    <Text style={[styles.mockHeaderSub, { color: textSub }]}>Currently Unoccupied</Text>
                  </View>
                </View>
                <View style={[styles.liveStatusPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.liveStatusText, { color: '#10B981' }]}>14 FREE</Text>
                </View>
              </View>

              {/* Room Row 1 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: isDark ? '#0B0F24' : '#FFFFFF', borderColor: subtleBorder }]}>
                <View style={[styles.slotColorBar, { backgroundColor: '#10B981' }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: textTitle }]}>CS Lab 02</Text>
                    <View style={[styles.freeTagPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Text style={[styles.freeTagText, { color: '#10B981' }]}>Available 2 hrs</Text>
                    </View>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="hardware-chip-outline" size={12} color={textSub} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: textSub }]}>45 Systems • Air Conditioned</Text>
                  </View>
                </View>
              </View>

              {/* Room Row 2 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: isDark ? '#0B0F24' : '#FFFFFF', borderColor: subtleBorder }]}>
                <View style={[styles.slotColorBar, { backgroundColor: '#10B981' }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: textTitle }]}>Lecture Hall 05</Text>
                    <View style={[styles.freeTagPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Text style={[styles.freeTagText, { color: '#10B981' }]}>Free until 01:00</Text>
                    </View>
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="easel-outline" size={12} color={textSub} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: textSub }]}>Multimedia • 80 Seats</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Floating Tag */}
            <View style={[styles.floatingTag, { backgroundColor: '#059669', borderColor: '#34D399' }]}>
              <Ionicons name="radio" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.floatingTagText}>Real-Time Vacancy Radar</Text>
            </View>
          </View>
        );

      case 'offline':
        return (
          <View style={styles.heroIllustrationBox}>
            <View style={[styles.illustrationCard, { backgroundColor: cardElevated, borderColor: borderLine }]}>
              {/* Mock Offline Header */}
              <View style={styles.mockHeader}>
                <View style={styles.mockHeaderLeft}>
                  <View style={[styles.mockIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Ionicons name="cloud-offline" size={14} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={[styles.mockHeaderTitle, { color: textTitle }]}>Offline Database</Text>
                    <Text style={[styles.mockHeaderSub, { color: textSub }]}>Encrypted Local Cache</Text>
                  </View>
                </View>
                <View style={[styles.liveStatusPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                  <Ionicons name="checkmark-circle" size={11} color="#F59E0B" style={{ marginRight: 3 }} />
                  <Text style={[styles.liveStatusText, { color: '#F59E0B' }]}>CACHED</Text>
                </View>
              </View>

              {/* Offline Row 1 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: isDark ? '#0B0F24' : '#FFFFFF', borderColor: subtleBorder }]}>
                <View style={[styles.slotColorBar, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: textTitle }]}>Full Weekly Timetable</Text>
                    <Ionicons name="flash" size={13} color="#F59E0B" />
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="speedometer-outline" size={12} color={textSub} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: textSub }]}>0ms Instant Load Without Internet</Text>
                  </View>
                </View>
              </View>

              {/* Offline Row 2 */}
              <View style={[styles.mockScheduleRow, { backgroundColor: isDark ? '#0B0F24' : '#FFFFFF', borderColor: subtleBorder }]}>
                <View style={[styles.slotColorBar, { backgroundColor: '#6366F1' }]} />
                <View style={styles.slotContent}>
                  <View style={styles.slotTop}>
                    <Text style={[styles.slotSubject, { color: textTitle }]}>Smart Background Sync</Text>
                    <Ionicons name="sync-circle" size={14} color="#6366F1" />
                  </View>
                  <View style={styles.slotMeta}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={textSub} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotMetaText, { color: textSub }]}>Auto updates when network is available</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Floating Tag */}
            <View style={[styles.floatingTag, { backgroundColor: '#D97706', borderColor: '#FBBF24' }]}>
              <Ionicons name="infinite" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.floatingTagText}>Zero Mobile Data Consumed</Text>
            </View>
          </View>
        );
    }
  };

  const renderPage = ({ item }: { item: OnboardingPageData }) => {
    return (
      <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
        <View style={[styles.mainCard, { backgroundColor: cardSurface, borderColor: borderLine }]}>
          {/* Top Illustration Box */}
          {renderScreenIllustration(item.type)}

          {/* Badge */}
          <View
            style={[
              styles.screenBadge,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                borderColor: item.badgeColor + '40',
              },
            ]}
          >
            <Ionicons name={item.badgeIcon} size={11} color={item.badgeColor} style={{ marginRight: 5 }} />
            <Text style={[styles.screenBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
          </View>

          {/* Heading and Subtitle */}
          <Text style={[styles.screenTitle, { color: textTitle }]}>{item.title}</Text>
          <Text style={[styles.screenSubtitle, { color: textSub }]}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgCanvas,
          paddingTop: insets.top + 4,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {/* 1. Header Bar: Back (on screens 2-4), Branding, Theme Toggle & Skip */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {currentIndex > 0 ? (
            <Pressable
              style={[
                styles.backBtn,
                {
                  backgroundColor: cardElevated,
                  borderColor: borderLine,
                },
              ]}
              onPress={handleBack}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={18} color={textTitle} />
            </Pressable>
          ) : (
            <View
              style={[
                styles.brandPill,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                },
              ]}
            >
              <View style={styles.brandDot} />
              <Text style={styles.brandTag}>SHEDUOS</Text>
            </View>
          )}

          {currentIndex > 0 && (
            <View
              style={[
                styles.brandPill,
                {
                  marginLeft: 8,
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                },
              ]}
            >
              <View style={styles.brandDot} />
              <Text style={styles.brandTag}>SHEDUOS</Text>
            </View>
          )}
        </View>

        <View style={styles.topActions}>
          <Pressable
            style={[
              styles.skipBtn,
              {
                backgroundColor: cardElevated,
                borderColor: borderLine,
              },
            ]}
            onPress={handleFinish}
            hitSlop={8}
          >
            <Text style={[styles.skipBtnText, { color: textSub }]}>Skip</Text>
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
                      ? [styles.activeDot, { backgroundColor: '#6366F1' }]
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
        <Text style={[styles.footerText, { color: isDark ? '#475569' : colors.textMuted }]}>
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
    shadowColor: '#6366F1',
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
    backgroundColor: '#1D4ED8',
    overflow: 'hidden',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
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
