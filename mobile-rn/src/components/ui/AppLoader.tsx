import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export interface AppLoaderProps {
  /** Optional custom loading message */
  message?: string;
  /** Optional secondary subtitle */
  subtitle?: string;
  /** Whether the loader should fill the entire screen */
  fullScreen?: boolean;
  /** Size variant of the loader emblem */
  size?: 'small' | 'medium' | 'large';
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
}

export default function AppLoader({
  message = 'Loading your schedule...',
  subtitle = 'SchedUOS Smart Campus',
  fullScreen = false,
  size = 'medium',
  style,
}: AppLoaderProps) {
  const { colors, isDark } = useTheme();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial Fade In
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Subtle breath pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Smooth continuous rotation for halo ring
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [pulseAnim, rotateAnim, fadeAnim]);

  // Derived dimensions based on size
  const iconSize = size === 'small' ? 36 : size === 'large' ? 68 : 52;
  const ringSize = size === 'small' ? 62 : size === 'large' ? 104 : 84;

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.9],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        fullScreen ? styles.fullScreenContainer : styles.inlineContainer,
        {
          backgroundColor: fullScreen ? colors.background : 'transparent',
          opacity: fadeAnim,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      {/* Central Brand Ring Container */}
      <View style={[styles.emblemWrapper, { width: ringSize + 16, height: ringSize + 16 }]}>
        {/* Ambient Subtle Glow Halo */}
        <Animated.View
          style={[
            styles.ambientGlow,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: colors.primary,
              opacity: haloOpacity,
            },
          ]}
        />

        {/* Orbiting Arc Indicator Ring */}
        <Animated.View
          style={[
            styles.orbitingRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: colors.borderHighlight,
              borderTopColor: colors.primary,
              borderRightColor: colors.primaryLight,
              transform: [{ rotate: spin }],
            },
          ]}
        />

        {/* Inner App Icon Card with Breath Animation */}
        <Animated.View
          style={[
            styles.iconCard,
            {
              width: ringSize - 16,
              height: ringSize - 16,
              borderRadius: (ringSize - 16) / 2,
              backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
              borderColor: colors.border,
              transform: [{ scale }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: iconSize, height: iconSize, borderRadius: 10 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Typography Status Area */}
      {message ? (
        <View style={styles.textContainer}>
          <Text style={[styles.messageText, { color: colors.textPrimary }]}>
            {message}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  ambientGlow: {
    position: 'absolute',
    filter: 'blur(16px)',
  },
  orbitingRing: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  iconCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 4,
  },
  messageText: {
    fontSize: 14,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 11.5,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    opacity: 0.8,
  },
});
