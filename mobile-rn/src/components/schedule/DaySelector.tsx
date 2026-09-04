import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DaySelectorProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  activeTodayName?: string;
}

export default function DaySelector({ selectedDay, onSelectDay, activeTodayName }: DaySelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = activeTodayName === day;

          return (
            <Pressable
              key={day}
              style={[
                styles.tab,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
                isSelected && {
                  backgroundColor: colors.buttonGradientStart,
                  borderColor: colors.buttonGradientStart,
                },
                isToday && !isSelected && {
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => onSelectDay(day)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  isSelected && styles.selectedTabText,
                  isToday && !isSelected && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {day.substring(0, 3)}
              </Text>

              {isToday ? (
                <View style={[styles.dot, { backgroundColor: isSelected ? '#ffffff' : colors.primary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  tab: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
  },
  tabText: {
    fontSize: 12,
    fontWeight: Typography.weights.medium,
  },
  selectedTabText: {
    color: '#ffffff',
    fontWeight: Typography.weights.bold,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
});
