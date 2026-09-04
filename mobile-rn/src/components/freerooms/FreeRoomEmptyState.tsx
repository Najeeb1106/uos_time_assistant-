import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface FreeRoomEmptyStateProps {
  type: 'no_rooms' | 'no_master_data' | 'no_filter_match';
  onRetry?: () => void;
}

export default function FreeRoomEmptyState({ type, onRetry }: FreeRoomEmptyStateProps) {
  const { colors } = useTheme();

  let title = 'No rooms matched your criteria';
  let subtitle = "Try adjusting your search keywords or setting the status/type filters to 'All' to explore more spaces.";
  let icon = '🔍';

  if (type === 'no_master_data') {
    title = 'No Global Timetable Data';
    subtitle = 'Master university timetable dataset is not available yet. Please check back after a timetable is uploaded.';
    icon = '📡';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.iconText}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

      {onRetry ? (
        <Pressable
          style={[styles.button, { backgroundColor: colors.buttonGradientStart }]}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>Refresh Global Timetable</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 300,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});
