import { useSessionsService } from '@/features/patient-sessions/api/sessions.service';
import { Session } from '@/features/patient-sessions/types/session';
import { DateFilterSheet, DateFilterType, DateRange } from '@/features/shared/components/DateFilterSheet';
import { formatDate, formatTimeFromDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#10b981';
    case 'approved':
      return '#3b82f6';
    case 'process':
      return '#f59e0b';
    case 'pending':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'checkmark-circle';
    case 'approved':
      return 'checkmark-done-circle';
    case 'process':
      return 'time';
    case 'pending':
      return 'ellipse-outline';
    default:
      return 'ellipse-outline';
  }
};

const SessionCard: React.FC<{ session: Session; onPress: () => void }> = ({
  session,
  onPress,
}) => {
  const statusColor = getStatusColor(session.status);
  const statusIcon = getStatusIcon(session.status);

  return (
    <TouchableOpacity onPress={onPress} style={styles.sessionCard}>
      <LinearGradient
        colors={['#ffffff', '#f9fafb']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[PRIMARY, '#0f423f']}
                style={styles.avatar}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color="#ffffff"
                />
              </LinearGradient>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientName}>{session.patientName}</Text>
              <Text style={styles.sessionType}>{session.sessionType}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons
              name={statusIcon as any}
              size={12}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {session.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.sessionDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="medical" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{session.noteFormat}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="language" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{session.language}</Text>
            </View>
            {session.duration && (
              <View style={styles.detailItem}>
                <Ionicons name="time" size={14} color="#6b7280" />
                <Text style={styles.detailText}>{session.duration} min</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateTime}>
            <Text style={styles.date}>{formatDate(session.createdAt)}</Text>
            <Text style={styles.time}>{formatTimeFromDate(session.createdAt)}</Text>
          </View>
          <View style={styles.actionButton}>
            <Ionicons name="chevron-forward" size={16} color={PRIMARY} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

type FilterType = 'all' | 'completed' | 'approved' | 'process' | 'pending';

export default function SessionHistoryScreen() {
  const { useSessions } = useSessionsService();
  const [page] = useState(1);
  const [limit] = useState(50);
  const [startDateIso, setStartDateIso] = useState<string | undefined>(undefined);
  const [endDateIso, setEndDateIso] = useState<string | undefined>(undefined);
  const { data: sessionsResponse, isLoading, error, refetch } = useSessions(page, limit, startDateIso, endDateIso);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [currentRange, setCurrentRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    label: 'All time'
  });

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomSheetSnapPoints = useMemo(() => ['60%'], []);

  const sessions = sessionsResponse?.data || [];

  // Trigger server-side filtering when date range changes
  React.useEffect(() => {
    if (currentRange.startDate && currentRange.endDate) {
      // Convert to ISO strings in UTC for API
      const startUtc = new Date(Date.UTC(
        currentRange.startDate.getFullYear(),
        currentRange.startDate.getMonth(),
        currentRange.startDate.getDate(),
        0, 0, 0, 0
      ));
      const endUtc = new Date(Date.UTC(
        currentRange.endDate.getFullYear(),
        currentRange.endDate.getMonth(),
        currentRange.endDate.getDate(),
        23, 59, 59, 999
      ));
      setStartDateIso(startUtc.toISOString());
      setEndDateIso(endUtc.toISOString());
    } else {
      setStartDateIso(undefined);
      setEndDateIso(undefined);
    }
  }, [currentRange.startDate, currentRange.endDate]);

  const filteredSessions = useMemo(() => {
    // Server returns the date-filtered set. Show both completed and approved sessions.
    let filtered = sessions.filter(session => {
      const status = session.status.toLowerCase();
      return status === 'completed' || status === 'approved';
    });

    // Apply active filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(session => session.status.toLowerCase() === activeFilter);
    }

    return filtered;
  }, [sessions, activeFilter]);

  const getFilterCount = (filter: FilterType) => {
    // Only count completed and approved sessions
    const completedAndApproved = sessions.filter(session => {
      const status = session.status.toLowerCase();
      return status === 'completed' || status === 'approved';
    });

    if (filter === 'all') return completedAndApproved.length;
    return completedAndApproved.filter(session => session.status.toLowerCase() === filter).length;
  };

  const handleSessionPress = (sessionId: number) => {
    router.push({
      pathname: '/(primary)/session-details',
      params: { id: sessionId.toString() }
    });
  };

  const renderSession = ({ item }: { item: Session }) => (
    <SessionCard
      session={item}
      onPress={() => handleSessionPress(item.id)}
    />
  );

  const openDateFilter = () => bottomSheetModalRef.current?.present();
  const closeDateFilter = () => bottomSheetModalRef.current?.dismiss();

  const handleApplyDateFilter = (filterType: DateFilterType, range: DateRange) => {
    setDateFilter(filterType);
    setCurrentRange(range);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[PRIMARY, '#0f423f']} style={styles.header}>
          <Text style={styles.headerTitle}>Session History</Text>
          <Text style={styles.headerSubtitle}>Track your patient sessions</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[PRIMARY, '#0f423f']} style={styles.header}>
          <Text style={styles.headerTitle}>Session History</Text>
          <Text style={styles.headerSubtitle}>Track your patient sessions</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Failed to load sessions</Text>
          <Text style={styles.errorMessage}>
            Please check your connection and try again
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[PRIMARY, '#0f423f']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Session History</Text>
            <Text style={styles.headerSubtitle}>
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton} onPress={openDateFilter} activeOpacity={0.8}>
            <Ionicons name="filter" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerChipsRow}>
          <View style={styles.filterChip}>
            <Ionicons name="calendar" size={14} color="#e5e7eb" />
            <Text style={styles.filterChipText}>{currentRange.label}</Text>
            {dateFilter !== 'all' && (
              <TouchableOpacity onPress={() => {
                setDateFilter('all');
                setCurrentRange({ startDate: null, endDate: null, label: 'All time' });
              }} style={styles.clearChipButton}>
                <Ionicons name="close" size={14} color="#e5e7eb" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Filter Badges */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterBadge,
              activeFilter === 'all' && styles.activeFilterBadge
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'all' && styles.activeFilterText
            ]}>
              All ({getFilterCount('all')})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterBadge,
              activeFilter === 'completed' && styles.activeFilterBadge
            ]}
            onPress={() => setActiveFilter('completed')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={activeFilter === 'completed' ? '#ffffff' : '#10b981'} 
            />
            <Text style={[
              styles.filterText,
              activeFilter === 'completed' && styles.activeFilterText
            ]}>
              Completed ({getFilterCount('completed')})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterBadge,
              activeFilter === 'approved' && styles.activeFilterBadge
            ]}
            onPress={() => setActiveFilter('approved')}
          >
            <Ionicons 
              name="checkmark-done-circle" 
              size={16} 
              color={activeFilter === 'approved' ? '#ffffff' : '#3b82f6'} 
            />
            <Text style={[
              styles.filterText,
              activeFilter === 'approved' && styles.activeFilterText
            ]}>
              Approved ({getFilterCount('approved')})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {activeFilter === 'all' 
              ? (dateFilter === 'all' ? 'No sessions yet' : 'No sessions in this range')
              : `No ${activeFilter} sessions${dateFilter !== 'all' ? ' in this range' : ''}`
            }
          </Text>
          <Text style={styles.emptyMessage}>
            {activeFilter === 'all'
              ? (dateFilter === 'all'
                  ? 'Your completed and approved patient sessions will appear here'
                  : 'Try a different date range or clear the filter')
              : `No ${activeFilter} sessions found. Try selecting a different filter.`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        />
      )}

      {/* Date Filter Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={bottomSheetSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        enablePanDownToClose
      >
        <DateFilterSheet
          isVisible={true}
          onClose={closeDateFilter}
          onApplyFilter={handleApplyDateFilter}
          currentFilter={dateFilter}
          currentRange={currentRange}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    opacity: 0.9,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerChipsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff1A',
    gap: 6,
  },
  filterChipText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
  },
  clearChipButton: {
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  sessionCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  sessionType: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  cardContent: {
    marginBottom: 12,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateTime: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${PRIMARY}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScrollContainer: {
    paddingRight: 20,
    gap: 12,
    alignItems: 'center',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  activeFilterBadge: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '600',
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
  customRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginTop: 8,
  },
  customRangeText: {
    color: PRIMARY,
    fontWeight: '600',
  },
}); 