import { useSessionsService } from '@/features/patient-sessions/api/sessions.service';
import { CreateSessionPayload } from '@/features/patient-sessions/types/session';
import { PatientSelectionScreen } from '@/features/patients/components/PatientSelectionScreen';
import { Patient } from '@/features/patients/types/patient';
import { useLanguage } from '@/features/shared/hooks';
import { PRIMARY } from '@/features/shared/utils/theme';
import { TemplateSelectionScreen } from '@/features/templates/components/TemplateSelectionScreen';
import { Template } from '@/features/templates/types/template';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SessionStep = 'patient-selection' | 'template-selection';

const SessionScreen = () => {
  const router = useRouter();
  const { useCreateSession } = useSessionsService();
  const createSessionMutation = useCreateSession();
  const { getCurrentLanguageCode } = useLanguage();
  
  const [currentStep, setCurrentStep] = useState<SessionStep>('patient-selection');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  const handlePatientSelect = (patient: Patient, appointmentId?: number, sessionId?: number) => {
    setSelectedPatient(patient);
    setSelectedAppointmentId(appointmentId || null);
    
    // If sessionId is provided (appointment is IN PROGRESS), redirect to existing session
    if (sessionId) {
      router.push({
        pathname: '/(primary)/session-notes',
        params: { sessionId: sessionId.toString() }
      });
      
      // Reset state
      setCurrentStep('patient-selection');
      setSelectedPatient(null);
      setSelectedTemplate(null);
      setSelectedAppointmentId(null);
      return;
    }
    
    // Otherwise, proceed to template selection
    setCurrentStep('template-selection');
  };

  const handleTemplateSelect = async (template: Template) => {
    setSelectedTemplate(template);
    
    if (!selectedPatient) {
      Alert.alert('Error', 'No patient selected');
      return;
    }

    try {
      const sessionPayload: CreateSessionPayload = {
        patientId: selectedPatient.id.toString(),
        sex: selectedPatient.gender || 'Male', // Default to Male as per requirements
        sessionType: 'Telehealth', // Hardcoded as per requirements
        noteFormat: template.title,
        language: getCurrentLanguageCode(), // Get from user's language preference
        appointmentId: selectedAppointmentId?.toString(), // Include appointment ID if available
      };

      const session = await createSessionMutation.mutateAsync(sessionPayload);
      
      // Navigate to the session recording screen with the session ID
      router.push({
        pathname: '/(primary)/session-notes',
        params: { sessionId: session.id.toString() }
      });
      
      // Reset state
      setCurrentStep('patient-selection');
      setSelectedPatient(null);
      setSelectedTemplate(null);
      setSelectedAppointmentId(null);
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep === 'template-selection') {
      setCurrentStep('patient-selection');
      setSelectedTemplate(null);
      setSelectedAppointmentId(null);
    } else if (currentStep === 'patient-selection') {
      // Navigate back to the tabs instead of overview
      router.back();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'patient-selection', title: 'Select Patient', icon: 'person' },
      { key: 'template-selection', title: 'Choose Template', icon: 'description' },
      { key: 'recording', title: 'Record Session', icon: 'mic' },
    ];

    const currentStepIndex = currentStep === 'patient-selection' ? 0 : 
                           currentStep === 'template-selection' ? 1 : 2;

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              { backgroundColor: index <= currentStepIndex ? PRIMARY : '#E5E7EB' }
            ]}>
              <MaterialIcons 
                name={step.icon as any} 
                size={16} 
                color={index <= currentStepIndex ? 'white' : '#9CA3AF'} 
              />
            </View>
            <Text style={[
              styles.stepText,
              { color: index <= currentStepIndex ? PRIMARY : '#9CA3AF' }
            ]}>
              {step.title}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                { backgroundColor: index < currentStepIndex ? PRIMARY : '#E5E7EB' }
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {(currentStep === 'patient-selection' || currentStep === 'template-selection') && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentStep === 'patient-selection' ? 'Select Patient' : 'Select Template'}
            </Text>
          </View>
          {renderStepIndicator()}
        </>
      )}
      
      <View style={styles.screenContent}>
        {currentStep === 'patient-selection' && (
          <PatientSelectionScreen 
            onPatientSelect={handlePatientSelect} 
            showHeader={false}
          />
        )}
        
        {currentStep === 'template-selection' && (
          <TemplateSelectionScreen 
            onTemplateSelect={handleTemplateSelect} 
            showHeader={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: -1,
  },

  screenContent: {
    flex: 1,
  },
});

export default SessionScreen; 