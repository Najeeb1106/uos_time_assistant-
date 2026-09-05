import React from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export const TOOLBAR_HEIGHT = 48;

interface CollapsibleHeaderProps {
  title: string;
  scrollY: Animated.Value;
  rightAction?: React.ReactNode;
  onSettingsPress?: () => void;
  showThemeToggle?: boolean;
}

export default function CollapsibleHeader({
  title,
  scrollY,
  rightAction,
  onSettingsPress,
  showThemeToggle = false,
}: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const headerTotalHeight = TOOLBAR_HEIGHT + insets.top;

  // Use diffClamp so scrolling down hides header, and any scroll up reveals header immediately
  const diffClampY = Animated.diffClamp(scrollY, 0, headerTotalHeight);

  const translateY = diffClampY.interpolate({
    inputRange: [0, headerTotalHeight],
    outputRange: [0, -headerTotalHeight],
    extrapolate: 'clamp',
  });

  const opacity = diffClampY.interpolate({
    inputRange: [0, headerTotalHeight * 0.75, headerTotalHeight],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: headerTotalHeight,
          paddingTop: insets.top,
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.toolbar}>
        {/* Bold, Modern Sans-Serif App Bar Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Action / Settings Button */}
        <View style={styles.rightContainer}>
          {rightAction ? (
            rightAction
          ) : showThemeToggle ? (
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={toggleTheme}
              hitSlop={10}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={16}
                color={isDark ? colors.gold : colors.primary}
              />
            </Pressable>
          ) : onSettingsPress ? (
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={onSettingsPress}
              hitSlop={10}
            >
              <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconButtonPlaceholder: {
    width: 32,
    height: 32,
  },
});
