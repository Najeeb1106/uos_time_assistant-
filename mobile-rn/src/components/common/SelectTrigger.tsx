import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface SelectTriggerProps {
  label: string;
  value: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  placeholder?: string;
  colors?: ThemeColors;
}

export default function SelectTrigger({
  label,
  value,
  iconName = 'chevron-down-outline',
  onPress,
  placeholder = 'Select option',
  colors: customColors,
}: SelectTriggerProps) {
  const theme = useTheme();
  const colors = customColors || theme.colors;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={15}
            color={colors.primary}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.valueText,
            { color: value ? colors.textPrimary : colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={15} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  icon: {
    marginRight: 8,
  },
  valueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
