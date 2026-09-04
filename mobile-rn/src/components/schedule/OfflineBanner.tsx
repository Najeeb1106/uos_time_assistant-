import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface OfflineBannerProps {
  lastUpdated?: string | null;
}

export default function OfflineBanner({ lastUpdated }: OfflineBannerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.banner, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
      <Text style={[styles.text, { color: colors.warning }]}>
        ⚠️ Offline Mode — Showing cached timetable
        {lastUpdated ? ` (${new Date(lastUpdated).toLocaleDateString()})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});
