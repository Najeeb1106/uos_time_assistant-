import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format12HourTime } from '../../utils/timeUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface RoomFilterProps {
  visible: boolean;
  type: 'category' | 'status' | 'time' | null;
  categoryFilter: 'All' | 'Classrooms' | 'Labs';
  onCategoryChange: (cat: 'All' | 'Classrooms' | 'Labs') => void;
  statusFilter: 'All' | 'Free' | 'Occupied';
  onStatusChange: (status: 'All' | 'Free' | 'Occupied') => void;
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
  timeSlots?: string[];
  onClose: () => void;
}

export default function RoomFilter({
  visible,
  type,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  selectedTime,
  onTimeChange,
  timeSlots = [],
  onClose,
}: RoomFilterProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  if (!visible || !type) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.45)' },
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.bottomSheetCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 12,
            },
          ]}
        >
          {/* Header Drag Handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.surfaceElevated }]} />

          <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>
              {type === 'category'
                ? 'Select Room Category'
                : type === 'status'
                ? 'Select Availability Status'
                : 'Select Time Slot'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {type === 'time' ? (
            <ScrollView style={styles.timeScrollList} showsVerticalScrollIndicator={false}>
              <View style={styles.optionsList}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <Pressable
                      key={slot}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                        isSelected && {
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => {
                        if (onTimeChange) onTimeChange(slot);
                        onClose();
                      }}
                    >
                      <View style={styles.timeRowLeft}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={isSelected ? colors.primary : colors.textMuted}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: colors.textSecondary },
                            isSelected && { color: colors.textPrimary, fontWeight: '700' },
                          ]}
                        >
                          {format12HourTime(slot)}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.optionsList}>
              {type === 'category' ? (
                <>
                  {[
                    { id: 'All', label: 'All Room Types' },
                    { id: 'Classrooms', label: 'Lecture Classrooms' },
                    { id: 'Labs', label: 'Laboratories / Labs' },
                  ].map((opt) => {
                    const isSelected = categoryFilter === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.optionRow,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          isSelected && {
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => {
                          onCategoryChange(opt.id as any);
                          onClose();
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: colors.textSecondary },
                            isSelected && { color: colors.textPrimary, fontWeight: '700' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </>
              ) : (
                <>
                  {[
                    { id: 'All', label: 'All Rooms' },
                    { id: 'Free', label: 'Free Rooms Only' },
                    { id: 'Occupied', label: 'Occupied Rooms Only' },
                  ].map((opt) => {
                    const isSelected = statusFilter === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.optionRow,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                          isSelected && {
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => {
                          onStatusChange(opt.id as any);
                          onClose();
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: colors.textSecondary },
                            isSelected && { color: colors.textPrimary, fontWeight: '700' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  bottomSheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  timeScrollList: {
    maxHeight: 280,
  },
  optionsList: {
    gap: 6,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
  },
});
