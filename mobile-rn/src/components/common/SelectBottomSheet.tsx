import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectBottomSheetProps {
  visible: boolean;
  title: string;
  options: (SelectOption | string)[];
  selectedValue: string | number;
  onSelect: (value: any) => void;
  onClose: () => void;
  searchable?: boolean;
}

export default function SelectBottomSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchable = false,
}: SelectBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) return null;

  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Reliable max height: 88% of screen height and strictly under the top safe-area
  const maxSheetHeight = Math.min(
    screenHeight * 0.88,
    screenHeight - insets.top - 16
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(6, 8, 20, 0.75)' : 'rgba(0, 0, 0, 0.45)' }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.keyboardAvoid, { maxHeight: maxSheetHeight }]}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                maxHeight: maxSheetHeight,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            {/* Top Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: colors.surfaceElevated }]} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search Bar */}
            {searchable && (
              <View
                style={[
                  styles.searchWrapper,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="search-outline" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search options..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && Platform.OS !== 'ios' && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            )}

            {/* Option List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => String(item.value)}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              style={styles.listStyle}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
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
                      onSelect(item.value);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.textPrimary, fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching options found</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexShrink: 1,
  },
  dragHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  closeButton: {
    padding: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  listStyle: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    marginBottom: 6,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.xs,
  },
});
