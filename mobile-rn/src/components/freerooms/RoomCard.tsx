import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RoomStatus } from '../../utils/freeRoomUtils';
import { format12HourTime } from '../../utils/timeUtils';
import { useTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface RoomCardProps {
  item: RoomStatus;
  onPress?: (item: RoomStatus) => void;
}

export default function RoomCard({ item, onPress }: RoomCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0.15 : 0.04,
        },
        item.isFree
          ? [styles.freeCard, { borderLeftColor: colors.success }]
          : [styles.occupiedCard, { borderLeftColor: colors.error }],
      ]}
      onPress={() => onPress && onPress(item)}
    >
      {/* Top row: Category Badge & Room Name on Left, Status Badge on Right */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <View
            style={[
              styles.categoryBadge,
              item.category === 'Labs'
                ? { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.08)' }
                : { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)' },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: item.category === 'Labs' ? colors.secondary : colors.primary },
              ]}
            >
              {item.category === 'Labs' ? 'Lab' : 'Classroom'}
            </Text>
          </View>
          <Text style={[styles.roomName, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.room}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            item.isFree
              ? { backgroundColor: colors.successBg, borderColor: colors.successBorder }
              : { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isFree ? colors.success : colors.error },
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: item.isFree ? colors.success : colors.error },
            ]}
          >
            {item.isFree ? 'FREE NOW' : 'OCCUPIED'}
          </Text>
        </View>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryText,
            { color: item.isFree ? colors.success : colors.textSecondary },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.isFree
            ? item.nextClass
              ? `🟢 Free until ${format12HourTime(item.nextClass.startTime)}`
              : '🟢 Free for remainder of day'
            : `🔴 Occupied until ${format12HourTime(item.activeClass?.endTime || '')} • ${item.activeClass?.name || 'Lecture'}`}
        </Text>
      </View>

      {/* Footer Meta Row */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          📖 {item.todayClassesCount} {item.todayClassesCount === 1 ? 'class' : 'classes'} today
        </Text>
        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
          View Details →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 3.5,
  },
  freeCard: {},
  occupiedCard: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  summaryRow: {
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 6,
    marginTop: 2,
  },
  footerText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  viewDetailsText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
