import { useNotesService } from '@/features/quick-notes/api/notes.service';
import { GradientHeader } from '@/features/shared/components';
import { useAudioRecording } from '@/features/shared/hooks/useAudioRecording';
import { useLanguage } from '@/features/shared/hooks/useLanguage';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

type ProcessingStep = 'uploading' | 'transcribing' | 'saving' | 'complete';

export default function CreateQuickNotesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { state, startRecording, stopRecording, pauseRecording, resumeRecording, resetRecording, hasPermission } = useAudioRecording();
  const { useCreateNoteWithTranscription } = useNotesService();
  const { getCurrentLanguageCode } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('uploading');
  const [processingMessage, setProcessingMessage] = useState('');
  
  const createNoteMutation = useCreateNoteWithTranscription();
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(height * 0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const processingOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Individual wave bar animations for more realistic effect
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

  // Individual wave bar animations
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      const animations = waveAnimations.map((anim, index) => {
        const baseDelay = index * 100;
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
          { iterations: -1 }
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
      if (!state.isRecording && !isProcessing && !state.audioUri) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Show alert to confirm
      Alert.alert(
        'Quick Note in Progress',
        state.isRecording 
          ? 'You are currently recording a quick note. Leaving now will discard the recording. Are you sure you want to leave?'
          : isProcessing
            ? 'Your note is being processed. Leaving now may cause data loss. Are you sure you want to leave?'
            : 'You have an unsaved recording. Are you sure you want to leave?',
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
  }, [navigation, state.isRecording, isProcessing, state.audioUri]);

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
      case 'uploading':
        return 'Uploading audio...';
      case 'transcribing':
        return 'Transcribing your note...';
      case 'saving':
        return 'Saving your note...';
      case 'complete':
        return 'Note saved successfully!';
      default:
        return 'Processing...';
    }
  };

  const handleStartRecording = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required to record audio notes.',
        [{ text: 'OK' }]
      );
      return;
    }
    await startRecording();
  };

  const handleStopRecording = async () => {
    try {
      console.log('🎙️ Stopping recording...');
      const recordingResult = await stopRecording();
      console.log('🎙️ Recording stopped, result:', recordingResult);
      
      // Extract the actual URI from the result object
      let audioUri: string | null = null;
      
      if (typeof recordingResult === 'string') {
        audioUri = recordingResult;
      } else if (recordingResult && typeof recordingResult === 'object' && 'url' in recordingResult) {
        audioUri = (recordingResult as any).url;
      } else {
        audioUri = state.audioUri;
      }
      
      console.log('🎙️ Extracted audio URI:', audioUri);
      console.log('🎙️ State audio URI:', state.audioUri);
      
      if (!audioUri) {
        console.error('❌ No audio URI available');
        Alert.alert('Error', 'No audio recording found. Please try recording again.');
        return;
      }
      
      // Start processing
      console.log('🚀 Starting processing...');
      setIsProcessing(true);
      setProcessingStep('uploading');
      setProcessingMessage('');
      
      // Generate a title based on current time
      const now = new Date();
      const title = `Quick Note - ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      console.log('📝 Creating note with title:', title);
      console.log('🎵 Audio URI for transcription:', audioUri);
      
      const newNote = await createNoteMutation.mutateAsync({
        audioUri: audioUri,
        title,
        description: 'Voice note created from mobile app',
        languageCode: getCurrentLanguageCode?.() || 'en',
        onProgress: (progress) => {
          console.log('📊 Progress update:', progress);
          // Update UI based on real-time progress from transcription service
          setProcessingMessage(progress.message);
          
          switch (progress.step) {
            case 'uploading':
              setProcessingStep('uploading');
              break;
            case 'transcribing':
            case 'polling':
              setProcessingStep('transcribing');
              break;
            case 'sentences':
              setProcessingStep('saving');
              break;
            case 'complete':
              setProcessingStep('complete');
              break;
          }
        }
      });
      
      setProcessingStep('complete');
      setProcessingMessage('');
      setIsProcessing(false);

      // Navigate directly to the note details screen
      try {
        const noteId = (newNote as any)?.id?.toString?.() || String((newNote as any)?.id);
        router.replace({
          pathname: '/(primary)/note-player' as any,
          params: {
            noteId,
            noteData: JSON.stringify(newNote),
          },
        });
      } catch (_) {
        // If navigation fails, fall back to previous screen
        router.back();
      }
      
    } catch (error) {
      setIsProcessing(false);
      console.error('❌ Error processing note:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      
      Alert.alert(
        'Error',
        `Failed to process your note: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        [
          { text: 'OK' }
        ]
      );
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
    if (state.isRecording || state.audioUri) {
      Alert.alert(
        'Discard Recording?',
        'Are you sure you want to discard this recording?',
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetRecording();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader
        title="Quick Note"
        onClose={handleCancel}
      />

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
            <Text style={styles.processingText}>{getProcessingText()}</Text>
            {processingStep === 'uploading' && (
              <Text style={styles.processingSubtext}>
                Preparing your audio file...
              </Text>
            )}
            {processingStep === 'transcribing' && (
              <Text style={styles.processingSubtext}>
                This may take a few moments...
              </Text>
            )}
            {processingStep === 'saving' && (
              <Text style={styles.processingSubtext}>
                Almost done...
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ translateY: slideUpAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Recording Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: state.isRecording && !state.isPaused ? '#ef4444' : '#6b7280' }]} />
          <Text style={styles.statusText}>
            {state.isRecording 
              ? state.isPaused 
                ? 'Recording Paused' 
                : 'Recording...'
              : state.audioUri 
                ? 'Recording Complete'
                : 'Ready to Record'
            }
          </Text>
        </View>

        {/* Duration Display */}
        <Text style={styles.duration}>{formatDuration(state.duration)}</Text>

        {/* Animated Waveform Visualization */}
        <View style={styles.waveformContainer}>
          {waveAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveBar,
                {
                  transform: [
                    {
                      scaleY: anim,
                    },
                  ],
                  opacity: state.isRecording && !state.isPaused ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>

        {/* Recording Button */}
        <View style={styles.recordingButtonContainer}>
          <Animated.View
            style={[
              styles.recordingButtonWrapper,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.recordingButton,
                {
                  backgroundColor: state.isRecording
                    ? state.isPaused
                      ? '#f59e0b'
                      : '#ef4444'
                    : PRIMARY,
                },
              ]}
              onPress={state.isRecording ? (state.audioUri ? handleStopRecording : handlePauseResume) : handleStartRecording}
              disabled={state.isLoading || isProcessing}
            >
              <MaterialIcons
                name={
                  state.isRecording
                    ? state.isPaused
                      ? 'play-arrow'
                      : 'pause'
                    : 'mic'
                }
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {state.isRecording && (
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopRecording}
              disabled={state.isLoading || isProcessing}
            >
              <MaterialIcons name="stop" size={24} color="#fff" />
              <Text style={styles.controlButtonText}>Stop & Save</Text>
            </TouchableOpacity>
          )}
          
          {state.audioUri && !state.isRecording && !isProcessing && (
            <View style={styles.completedControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.retryButton]}
                onPress={resetRecording}
              >
                <MaterialIcons name="refresh" size={24} color={PRIMARY} />
                <Text style={[styles.controlButtonText, { color: PRIMARY }]}>Retry</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.saveButton]}
                onPress={handleStopRecording}
                disabled={createNoteMutation.isPending}
              >
                <MaterialIcons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.controlButtonText}>
                  {createNoteMutation.isPending ? 'Saving...' : 'Save & Transcribe'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructions */}
        {!state.isRecording && !state.audioUri && !isProcessing && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Tap the microphone to start recording your quick note
            </Text>
            <Text style={styles.instructionsSubtext}>
              Your audio will be automatically transcribed after recording
            </Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  processingContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  duration: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1f2937',
    marginBottom: 40,
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: 60,
    gap: 8,
  },
  waveBar: {
    width: 4,
    height: 80,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  recordingButtonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordingButtonWrapper: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  retryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  completedControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
}); 