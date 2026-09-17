import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../constants/Colors';

export interface ScheduleSkeletonProps {
  /** Number of skeleton cards to display (default: 3) */
  count?: number;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
}

export default function ScheduleSkeleton({ count = 3, style }: ScheduleSkeletonProps) {
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [shimmerAnim]);

  const skeletonCards = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={[styles.container, style]}>
      {skeletonCards.map((idx) => (
        <View
          key={`skel_${idx}`}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0.12 : 0.04,
            },
          ]}
        >
          {/* Header Row: Code Chip + Time Badge */}
          <View style={styles.headerRow}>
            <Animated.View
              style={[
                styles.chipPlaceholder,
                {
                  width: 80,
                  height: 18,
                  backgroundColor: colors.surfaceElevated,
                  opacity: shimmerAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.chipPlaceholder,
                {
                  width: 110,
                  height: 18,
                  backgroundColor: colors.surfaceElevated,
                  opacity: shimmerAnim,
                },
              ]}
            />
          </View>

          {/* Title Row */}
          <Animated.View
            style={[
              styles.linePlaceholder,
              {
                width: '75%',
                height: 16,
                backgroundColor: colors.surfaceElevated,
                marginTop: 10,
                opacity: shimmerAnim,
              },
            ]}
          />

          {/* Subtitle / Department Row */}
          <Animated.View
            style={[
              styles.linePlaceholder,
              {
                width: '50%',
                height: 12,
                backgroundColor: colors.surfaceElevated,
                marginTop: 8,
                opacity: shimmerAnim,
              },
            ]}
          />

          {/* Footer Row: Teacher + Section Badge */}
          <View style={styles.footerRow}>
            <Animated.View
              style={[
                styles.chipPlaceholder,
                {
                  width: 120,
                  height: 14,
                  backgroundColor: colors.surfaceElevated,
                  opacity: shimmerAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.chipPlaceholder,
                {
                  width: 60,
                  height: 16,
                  borderRadius: 6,
                  backgroundColor: colors.surfaceElevated,
                  opacity: shimmerAnim,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  chipPlaceholder: {
    borderRadius: 8,
  },
  linePlaceholder: {
    borderRadius: 4,
  },
});
