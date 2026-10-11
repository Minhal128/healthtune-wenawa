import { GradientHeader } from '@/features/shared/components';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { usePatientsService } from '../api/patients.service';
import { Patient } from '../types/patient';
import { PatientCard } from './PatientCard';

interface PatientSelectionScreenProps {
  onPatientSelect: (patient: Patient, appointmentId?: number, sessionId?: number) => void;
  showHeader?: boolean; // Add option to hide header when used in workflow
}

export const PatientSelectionScreen: React.FC<PatientSelectionScreenProps> = ({
  onPatientSelect,
  showHeader = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { usePatients } = usePatientsService();
  const { data: patients = [], isLoading, error, refetch } = usePatients();

  const filteredPatients = patients.filter(
    (patient) => {
      // Filter out patients with no appointments
      if (!patient.appointments || patient.appointments.length === 0) {
        return false;
      }
      
      // Filter out patients with no "Scheduled" appointments
      const hasScheduledAppointments = patient.appointments.some(
        apt => apt.status.toLowerCase() === 'scheduled'
      );
      if (!hasScheduledAppointments) {
        return false;
      }
      
      // Apply search filter
      return (
        patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.mreNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

  const handlePatientSelect = (patient: Patient, appointmentId?: number, sessionId?: number) => {
    onPatientSelect(patient, appointmentId, sessionId);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <PatientCard patient={item} onPress={handlePatientSelect} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No patients found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search criteria'
          : 'No patients available at the moment'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <MaterialIcons name="error-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>
        Unable to load patients. Please try again.
      </Text>
    </View>
  );

  if (error && !patients.length) {
    return (
      <View style={styles.container}>
        {showHeader && <GradientHeader title="Select Patient" onClose={() => {}} />}
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && <GradientHeader title="Select Patient" onClose={() => {}} />}
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients by name or MRE number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <MaterialIcons
              name="clear"
              size={20}
              color="#9CA3AF"
              onPress={() => setSearchQuery('')}
            />
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.resultCount}>
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {isLoading && !patients.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPatients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPatient}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                colors={[PRIMARY]}
                tintColor={PRIMARY}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 4,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PatientSelectionScreen; 