import { parseUTCDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Patient } from '../types/patient';

interface PatientCardProps {
  patient: Patient;
  onPress: (patient: Patient, appointmentId?: number, sessionId?: number) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);

  // Only show scheduled appointments
  const scheduledAppointments = patient.appointments?.filter(
    apt => apt.status.toLowerCase() === 'scheduled'
  ) || [];

  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim();
  };

  const getGenderIcon = (gender: string | null) => {
    if (gender === 'Male') return 'male';
    if (gender === 'Female') return 'female';
    return 'person';
  };

  const getGenderColor = (gender: string | null) => {
    if (gender === 'Male') return '#3B82F6';
    if (gender === 'Female') return '#EC4899';
    return '#6B7280';
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = parseUTCDate(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'in progress': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handlePatientSelect = () => {
    if (scheduledAppointments.length > 0) {
      if (selectedAppointmentId) {
        const selectedAppointment = scheduledAppointments.find(apt => apt.id === selectedAppointmentId);
        onPress(patient, selectedAppointmentId, selectedAppointment?.sessionId || undefined);
      } else {
        // If no appointment selected, select the first scheduled one
        const firstAppointment = scheduledAppointments[0];
        onPress(patient, firstAppointment.id, firstAppointment.sessionId || undefined);
      }
    } else {
      onPress(patient);
    }
  };

  const handleAppointmentSelect = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    const selectedAppointment = scheduledAppointments.find(apt => apt.id === appointmentId);
    onPress(patient, appointmentId, selectedAppointment?.sessionId || undefined);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={handlePatientSelect}
        activeOpacity={0.7}
      >
        <View style={styles.patientInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.patientName}>
              {formatName(patient.firstName, patient.lastName)}
            </Text>
            <View style={[styles.genderBadge, { backgroundColor: getGenderColor(patient.gender) }]}>
              <MaterialIcons 
                name={getGenderIcon(patient.gender) as any} 
                size={12} 
                color="white" 
              />
              <Text style={styles.genderText}>{patient.gender || 'N/A'}</Text>
            </View>
          </View>
          <Text style={styles.mreNumber}>{patient.mreNumber}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={PRIMARY} />
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{patient.email || 'No email'}</Text>
          </View>
          {patient.dateOfBirth && (
            <View style={styles.infoItem}>
              <MaterialIcons name="cake" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {parseUTCDate(patient.dateOfBirth).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {patient.occupation && (
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="work" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{patient.occupation}</Text>
            </View>
          </View>
        )}

        {/* Appointments Section - Only show scheduled appointments */}
        {scheduledAppointments.length > 0 && (
          <View style={styles.appointmentsSection}>
            <TouchableOpacity
              style={styles.appointmentsHeader}
              onPress={() => setShowAppointments(!showAppointments)}
            >
              <View style={styles.appointmentsTitleContainer}>
                <MaterialIcons name="event" size={16} color={PRIMARY} />
                <Text style={styles.appointmentsTitle}>
                  {scheduledAppointments.length} Scheduled Appointment{scheduledAppointments.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <MaterialIcons 
                name={showAppointments ? "expand-less" : "expand-more"} 
                size={20} 
                color={PRIMARY} 
              />
            </TouchableOpacity>

            {showAppointments && (
              <View style={styles.appointmentsList}>
                {scheduledAppointments.map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={[
                      styles.appointmentItem,
                      selectedAppointmentId === appointment.id && styles.selectedAppointment
                    ]}
                    onPress={() => handleAppointmentSelect(appointment.id)}
                  >
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentDate}>
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </Text>
                      <Text style={styles.appointmentType}>{appointment.appointmentType}</Text>
                    </View>
                    <View style={styles.appointmentStatus}>
                      <View style={[
                        styles.statusDot, 
                        { backgroundColor: getAppointmentStatusColor(appointment.status) }
                      ]} />
                      <Text style={styles.statusText}>{appointment.status}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: patient.admissionDetails.isDischarged ? '#EF4444' : '#10B981' }
            ]} />
            <Text style={styles.statusText}>
              {patient.admissionDetails.isDischarged ? 'Discharged' : 'Active'}
            </Text>
          </View>
          <Text style={styles.createdDate}>
            Added {parseUTCDate(patient.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  patientInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genderText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
    marginLeft: 2,
  },
  mreNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: PRIMARY,
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  appointmentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  appointmentsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 6,
  },
  appointmentsList: {
    marginTop: 8,
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAppointment: {
    backgroundColor: '#EBF8FF',
    borderColor: PRIMARY,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  appointmentType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  appointmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PatientCard; 