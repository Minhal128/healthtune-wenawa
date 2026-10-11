import { useSessionsService } from '@/features/patient-sessions/api/sessions.service';
import { GradientHeader } from '@/features/shared/components';
import { useAudioRecording } from '@/features/shared/hooks/useAudioRecording';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

type ProcessingStep = 'transcribing' | 'generating_notes' | 'saving_all' | 'complete';

export default function SessionNotesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { state, startRecording, stopRecording, pauseRecording, resumeRecording, resetRecording, hasPermission } = useAudioRecording();
  const { useSession, useCompleteSessionWorkflow } = useSessionsService();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('transcribing');
  const [processingMessage, setProcessingMessage] = useState('');
  
  const { data: session, isLoading: sessionLoading } = useSession(sessionId || '');
  const completeWorkflowMutation = useCompleteSessionWorkflow();
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(height * 0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const processingOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Individual wave animations
  const waveAnimations = useRef(
    Array(8).fill(0).map(() => new Animated.Value(0.3))
  ).current;

  // Pulse animation for recording button
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.isRecording, state.isPaused]);

  // Wave animations
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      const animations = waveAnimations.map((anim, index) => {
        const baseDuration = 300 + Math.random() * 400;
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 1.0,
              duration: baseDuration,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.4,
              duration: baseDuration * 0.8,
              useNativeDriver: true,
            }),
          ]),
        );
      });

      animations.forEach((animation, index) => {
        setTimeout(() => animation.start(), index * 50);
      });

      return () => {
        animations.forEach(animation => animation.stop());
      };
    } else {
      waveAnimations.forEach(anim => anim.setValue(0.3));
    }
  }, [state.isRecording, state.isPaused]);

  // Block back navigation during recording or processing
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Allow navigation if not recording and not processing
      if (!state.isRecording && !isProcessing) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Show alert to confirm
      Alert.alert(
        'Session in Progress',
        state.isRecording 
          ? 'You are currently recording a session. Leaving now will discard the recording. Are you sure you want to leave?'
          : 'Your session is being processed. Leaving now may cause data loss. Are you sure you want to leave?',
        [
          { text: "Don't Leave", style: 'cancel', onPress: () => {} },
          {
            text: 'Leave Anyway',
            style: 'destructive',
            onPress: () => {
              // Reset recording state and allow navigation
              resetRecording();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, state.isRecording, isProcessing]);

  // Slide up animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Processing animation
  useEffect(() => {
    if (isProcessing) {
      Animated.timing(processingOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(processingOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isProcessing]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessingText = (): string => {
    if (processingMessage) {
      return processingMessage;
    }
    
    switch (processingStep) {
      case 'transcribing':
        return 'Transcribing session...';
      case 'generating_notes':
        return 'Generating notes...';
      case 'saving_all':
        return 'Saving session details...';
      case 'complete':
        return 'Session completed successfully!';
      default:
        return 'Processing...';
    }
  };

  const handleStartRecording = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required to record session notes.',
        [{ text: 'OK' }]
      );
      return;
    }
    await startRecording();
  };

  const handleStopRecording = async () => {
    if (!session) {
      Alert.alert('Error', 'Session not found');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🎙️ Stopping recording...');
      const recordingResult = await stopRecording();
      
      let audioUri: string | null = null;
      if (typeof recordingResult === 'string') {
        audioUri = recordingResult;
      } else if (recordingResult && typeof recordingResult === 'object' && 'url' in recordingResult) {
        audioUri = (recordingResult as any).url;
      } else {
        audioUri = state.audioUri;
      }
      
      if (!audioUri) {
        Alert.alert('Error', 'No audio recording found. Please try recording again.');
        setIsProcessing(false);
        return;
      }

      console.log('🎙️ Starting session workflow...');
      console.log('📋 Session ID:', session.id.toString());
      console.log('🎵 Audio URI:', audioUri);
      
      try {
        const result = await completeWorkflowMutation.mutateAsync({
          sessionId: session.id.toString(),
          audioUri,
          session,
          onProgress: (progress) => {
            console.log('📊 Progress update:', progress);
            setProcessingStep(progress.step as ProcessingStep);
            setProcessingMessage(progress.message);
          },
        });
        
        console.log('✅ Workflow completed successfully:', result);
        
        // Navigate to session details instead of showing alert
        router.push({
          pathname: '/(primary)/session-details',
          params: { id: session.id.toString() }
        });
      } catch (workflowError) {
        console.error('❌ Workflow failed:', workflowError);
        throw workflowError;
      }
    } catch (error) {
      console.error('❌ Error processing session:', error);
      Alert.alert('Error', 'Failed to process session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseResume = async () => {
    if (state.isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            resetRecording();
            router.back();
          },
        },
      ]
    );
  };

  if (sessionLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Session Notes" onClose={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Session Notes" onClose={() => router.back()} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The requested session could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Session Notes" onClose={handleCancel} />
      
      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.patientName}>{session.patientName}</Text>
        <Text style={styles.sessionDetails}>
          {session.noteFormat} • {session.sessionType}
        </Text>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ translateY: slideUpAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Wave visualization */}
        <View style={styles.waveContainer}>
          {waveAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveBar,
                {
                  transform: [{ scaleY: anim }],
                  backgroundColor: state.isRecording && !state.isPaused ? PRIMARY : '#E5E7EB',
                },
              ]}
            />
          ))}
        </View>

        {/* Recording Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {formatDuration(state.duration)}
          </Text>
          <Text style={styles.timerLabel}>
            {state.isRecording && !state.isPaused ? 'Recording...' : 
             state.isPaused ? 'Paused' : 'Ready to record'}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {state.isRecording && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePauseResume}
              disabled={isProcessing}
            >
              <MaterialIcons
                name={state.isPaused ? 'play-arrow' : 'pause'}
                size={24}
                color={PRIMARY}
              />
            </TouchableOpacity>
          )}

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                {
                  backgroundColor: state.isRecording ? '#EF4444' : PRIMARY,
                },
              ]}
              onPress={state.isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
            >
              <MaterialIcons
                name={state.isRecording ? 'stop' : 'mic'}
                size={32}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>

          {state.isRecording && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancel}
              disabled={isProcessing}
            >
              <MaterialIcons name="close" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            {!state.isRecording
              ? 'Tap the microphone to start recording your session'
              : 'Tap stop when you finish your session'}
          </Text>
        </View>
      </Animated.View>

      {/* Processing Overlay */}
      {isProcessing && (
        <Animated.View 
          style={[
            styles.processingOverlay,
            { opacity: processingOpacityAnim }
          ]}
        >
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.processingTitle}>Processing Session</Text>
            <Text style={styles.processingText}>{getProcessingText()}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  sessionInfo: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: 40,
  },
  waveBar: {
    width: 4,
    height: 60,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#111827',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  instructionsContainer: {
    paddingHorizontal: 32,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 