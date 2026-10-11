import { Appointment, AppointmentsAPI } from '@/features/appointments/api/appointments.api';
import FloatingVoiceButton from '@/features/shared/components/FloatingVoiceButton';
import { useLanguage } from '@/features/shared/hooks';
import { formatTimeFromDate, parseUTCDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { useUser } from '@/features/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface DayInfo {
  day: number;
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { getCurrentLanguageCode } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<DayInfo[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  // Generate week days
  useEffect(() => {
    const today = new Date();
    const currentWeek = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      currentWeek.push({
        day: date.getDate(),
        date: date,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
      });
    }
    setWeekDays(currentWeek);
  }, [selectedDate]);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoadError(null);
      const response = await AppointmentsAPI.getUserAppointments(1, 50);
      setAppointments(response.data);
      filterAppointmentsByDate(response.data, selectedDate);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoadError('Unable to load appointments');
      setAppointments([]);
      setTodayAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter appointments by selected date
  const filterAppointmentsByDate = (allAppointments: Appointment[], date: Date) => {
    const dateString = date.toDateString();
    const filtered = allAppointments.filter(appointment => {
      const appointmentDate = parseUTCDate(appointment.appointmentDate);
      return appointmentDate.toDateString() === dateString;
    });
    setTodayAppointments(filtered);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointmentsByDate(appointments, selectedDate);
  }, [selectedDate, appointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getDoctorInitials = (email: string) => {
    if (!email) return 'DR';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getDoctorName = (email: string) => {
    if (!email) return 'Doctor';
    const username = email.split('@')[0];
    const parts = username.split('.');
    if (parts.length >= 2) {
      return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return '#3B82F6';
      case 'follow-up':
        return '#10B981';
      case 'emergency':
        return '#EF4444';
      default:
        return PRIMARY;
    }
  };



  const getCurrencySymbol = () => {
    const currentLanguage = getCurrentLanguageCode();
    return currentLanguage === 'ur' ? 'Rs ' : '$';
  };

  const handleDayPress = (dayInfo: DayInfo) => {
    setSelectedDate(dayInfo.date);
  };

  const renderDayItem = ({ item }: { item: DayInfo }) => (
    <TouchableOpacity
      style={[
        styles.dayItem,
        item.isSelected && styles.selectedDay,
        item.isToday && !item.isSelected && styles.todayDay,
      ]}
      onPress={() => handleDayPress(item)}
    >
      <Text style={[
        styles.dayText,
        item.isSelected && styles.selectedDayText,
        item.isToday && !item.isSelected && styles.todayDayText,
      ]}>
        {item.day}
      </Text>
    </TouchableOpacity>
  );

  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <View style={[styles.avatarContainer, { backgroundColor: getAppointmentTypeColor(item.appointmentType) }]}>
            <Text style={styles.avatarText}>
              {item.patient.firstName.charAt(0)}{item.patient.lastName.charAt(0)}
            </Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {item.patient.firstName} {item.patient.lastName}
            </Text>
            <Text style={styles.patientMre}>{item.patient.mreNumber}</Text>
          </View>
        </View>
        <View style={styles.appointmentTime}>
          <Text style={styles.timeText}>{formatTimeFromDate(item.appointmentDate)}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentTag}>
          <View style={[styles.tagDot, { backgroundColor: getAppointmentTypeColor(item.appointmentType) }]} />
          <Text style={styles.tagText}>{item.appointmentType}</Text>
        </View>
        {(item.isTelemedicine || item.location) && (
          <Text style={styles.appointmentLocation}>
            <Ionicons name={item.isTelemedicine ? "videocam" : "location"} size={14} color="#6B7280" />
            {' '}{item.isTelemedicine ? 'Telemedicine' : item.roomNumber ? `${item.location} - Room ${item.roomNumber}` : item.location}
          </Text>
        )}
      </View>
      
      <View style={styles.appointmentFooter}>
        {item.consultationFee && item.consultationFee > 0 && (
          <Text style={styles.consultationFee}>{getCurrencySymbol()}{item.consultationFee}</Text>
        )}
        <Text style={styles.duration}>{item.duration} min</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <LinearGradient
          colors={[PRIMARY, '#0f423f']}
          style={styles.welcomeCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.doctorInfo}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorInitials}>
                  {user?.emailAddresses?.[0]?.emailAddress ? getDoctorInitials(user.emailAddresses[0].emailAddress) : 'DR'}
                </Text>
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.doctorName}>
                  Dr. {user?.emailAddresses?.[0]?.emailAddress ? getDoctorName(user.emailAddresses[0].emailAddress) : 'Doctor'}
                </Text>
              </View>
            </View>
            {/* <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity> */}
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{appointments.length}</Text>
              <Text style={styles.statLabel}>Total Appointments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayAppointments.length}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Appointments Section */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appointments</Text>
            <Text style={styles.currentMonth}>
              {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
          </View>

          {/* Week Calendar */}
          <View style={styles.weekContainer}>
            <FlatList
              data={weekDays}
              renderItem={renderDayItem}
              keyExtractor={(item) => item.date.toISOString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekContent}
            />
          </View>

          {/* Today's Appointments */}
          <View style={styles.todaySection}>
            <Text style={styles.todayTitle}>
              {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 'Selected Day'}
            </Text>
            <Text style={styles.todaySubtitle}>{todayAppointments.length} appointments</Text>
          </View>

                     {todayAppointments.length > 0 ? (
             <FlatList
               data={todayAppointments}
               renderItem={renderAppointmentCard}
               keyExtractor={(item) => item.id.toString()}
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.appointmentsContent}
               ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
             />
           ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{loadError ? 'Something went wrong' : 'No appointments'}</Text>
              <Text style={styles.emptyMessage}>
                {loadError || "You don't have any appointments scheduled for this day."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingVoiceButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginTop: 60,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  doctorDetails: {
    flex: 1,
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  appointmentsSection: {
    marginTop: 32,
    paddingBottom: 140,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  currentMonth: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  weekContainer: {
    marginBottom: 24,
  },
  weekContent: {
    paddingHorizontal: 20,
  },
  dayItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDay: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  todayDay: {
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedDayText: {
    color: '#fff',
  },
  todayDayText: {
    color: PRIMARY,
  },
  todaySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  todaySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentsContent: {
    paddingHorizontal: 16,
  },
  appointmentCard: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  patientMre: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  appointmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  appointmentLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 