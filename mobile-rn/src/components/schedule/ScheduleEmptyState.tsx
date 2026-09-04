import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface ScheduleEmptyStateProps {
  onUploadPress?: () => void;
}

export default function ScheduleEmptyState({ onUploadPress }: ScheduleEmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.iconText}>📅</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>No Schedule Uploaded</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        There is no timetable in your account yet. Upload your department PDF timetable to view your lectures.
      </Text>

      {onUploadPress ? (
        <Pressable
          style={[styles.button, { backgroundColor: colors.buttonGradientStart }]}
          onPress={onUploadPress}
        >
          <Text style={styles.buttonText}>Upload Timetable PDF</Text>
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
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
