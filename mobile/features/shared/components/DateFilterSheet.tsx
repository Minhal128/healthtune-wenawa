import { PRIMARY } from '@/features/shared/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DateFilterType = 'all' | 'today' | 'last7' | 'last30' | 'last90' | 'custom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  label: string;
}

interface DateFilterSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilter: (filterType: DateFilterType, range: DateRange) => void;
  currentFilter: DateFilterType;
  currentRange: DateRange;
}

export const DateFilterSheet: React.FC<DateFilterSheetProps> = ({
  isVisible,
  onClose,
  onApplyFilter,
  currentFilter,
  currentRange,
}) => {
  const insets = useSafeAreaInsets();
  const [customStartDate, setCustomStartDate] = useState<Date | null>(currentRange.startDate);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(currentRange.endDate);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const applyQuickDateFilter = (filterType: DateFilterType) => {
    const range = getDateRangeForFilter(filterType);
    onApplyFilter(filterType, range);
    onClose();
  };

  const getDateRangeForFilter = (filterType: DateFilterType): DateRange => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let label = 'All time';

    switch (filterType) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        label = 'Today';
        break;
      case 'last7':
        endDate = now;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        label = 'Last 7 days';
        break;
      case 'last30':
        endDate = now;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        label = 'Last 30 days';
        break;
      case 'last90':
        endDate = now;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        label = 'Last 90 days';
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        if (startDate && endDate) {
          const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
          const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endStr = endDate.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' });
          const yearSuffix = startDate.getFullYear() !== endDate.getFullYear() ? `, ${endDate.getFullYear()}` : '';
          label = `${startStr}–${endStr}${yearSuffix}`;
        } else {
          label = 'Custom range';
        }
        break;
      case 'all':
      default:
        startDate = null;
        endDate = null;
        label = 'All time';
    }

    return { startDate, endDate, label };
  };

  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

  const handleDayPress = (day: Date) => {
    if (!customStartDate || (customStartDate && customEndDate)) {
      setCustomStartDate(day);
      setCustomEndDate(null);
      return;
    }
    // If selecting end date
    if (customStartDate && !customEndDate) {
      if (day.getTime() < customStartDate.getTime()) {
        // If picked before start, make it the new start
        setCustomStartDate(day);
        return;
      }
      setCustomEndDate(day);
    }
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const isWithinRange = (d: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    const t = d.setHours(0, 0, 0, 0);
    const s = start.setHours(0, 0, 0, 0);
    const e = end.setHours(0, 0, 0, 0);
    return t >= s && t <= e;
  };

  const handleApplyCustom = () => {
    if (customStartDate && customEndDate) {
      const range = getDateRangeForFilter('custom');
      onApplyFilter('custom', range);
      onClose();
    }
  };

  const handleClear = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    onApplyFilter('all', { startDate: null, endDate: null, label: 'All time' });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <BottomSheetView style={styles.container}>
      <BottomSheetScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Filter by date</Text>
        
        {/* Quick Filter Pills */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            onPress={() => applyQuickDateFilter('today')}
            style={[styles.quickPill, currentFilter === 'today' && styles.quickPillActive]}
          >
            <Text style={[styles.quickPillText, currentFilter === 'today' && styles.quickPillTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => applyQuickDateFilter('last7')}
            style={[styles.quickPill, currentFilter === 'last7' && styles.quickPillActive]}
          >
            <Text style={[styles.quickPillText, currentFilter === 'last7' && styles.quickPillTextActive]}>
              Last 7 days
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickRow}>
          <TouchableOpacity
            onPress={() => applyQuickDateFilter('last30')}
            style={[styles.quickPill, currentFilter === 'last30' && styles.quickPillActive]}
          >
            <Text style={[styles.quickPillText, currentFilter === 'last30' && styles.quickPillTextActive]}>
              Last 30 days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => applyQuickDateFilter('last90')}
            style={[styles.quickPill, currentFilter === 'last90' && styles.quickPillActive]}
          >
            <Text style={[styles.quickPillText, currentFilter === 'last90' && styles.quickPillTextActive]}>
              Last 90 days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              onPress={() => setCalendarMonth(prev => addMonths(prev, -1))} 
              style={styles.navBtn}
            >
              <Ionicons name="chevron-back" size={18} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.calendarHeaderText}>
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity 
              onPress={() => setCalendarMonth(prev => addMonths(prev, 1))} 
              style={styles.navBtn}
            >
              <Ionicons name="chevron-forward" size={18} color="#111827" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekdaysRow}>
            {['Su','M','Tu','W','Th','F','Sa'].map(d => (
              <Text key={d} style={styles.weekdayText}>{d}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {(() => {
              const days: React.ReactNode[] = [];
              const firstDay = startOfMonth(calendarMonth);
              const lastDay = endOfMonth(calendarMonth);
              const startWeekday = firstDay.getDay();
              
              // Add empty cells for days before the first day of the month
              for (let i = 0; i < startWeekday; i++) {
                days.push(<View key={`empty-start-${i}`} style={styles.dayCell} />);
              }
              
              // Add cells for each day of the month
              for (let day = 1; day <= lastDay.getDate(); day++) {
                const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                const selectedStart = customStartDate && isSameDay(current, customStartDate);
                const selectedEnd = customEndDate && isSameDay(current, customEndDate);
                const inRange = isWithinRange(current, customStartDate, customEndDate);
                const isSelected = !!selectedStart || !!selectedEnd;
                
                days.push(
                  <TouchableOpacity 
                    key={`day-${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${day}`} 
                    style={[
                      styles.dayCell, 
                      inRange && styles.dayInRange, 
                      isSelected && styles.daySelected
                    ]} 
                    onPress={() => handleDayPress(current)}
                  >
                    <Text style={[
                      styles.dayText, 
                      isSelected && styles.dayTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              }
              
              // Add empty cells to complete the last week if needed
              const totalCells = days.length;
              const remainingCells = 7 - (totalCells % 7);
              if (remainingCells < 7) {
                for (let i = 0; i < remainingCells; i++) {
                  days.push(<View key={`empty-end-${i}`} style={styles.dayCell} />);
                }
              }
              
              return days;
            })()}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyBtn, !(customStartDate && customEndDate) && styles.applyBtnDisabled]}
            disabled={!(customStartDate && customEndDate)}
            onPress={handleApplyCustom}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 40 : 24,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  quickPillActive: {
    backgroundColor: `${PRIMARY}15`,
    borderColor: PRIMARY,
  },
  quickPillText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  quickPillTextActive: {
    color: PRIMARY,
  },
  calendarSection: {
    marginTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  calendarHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  weekdayText: {
    width: '13%',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '13%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayInRange: {
    backgroundColor: '#E5F4F2',
  },
  daySelected: {
    backgroundColor: `${PRIMARY}25`,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  dayText: {
    color: '#111827',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: PRIMARY,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: Platform.OS === 'android' ? 16 : 0,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#111827',
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default DateFilterSheet;
