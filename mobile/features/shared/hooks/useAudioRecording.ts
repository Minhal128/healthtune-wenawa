import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUri: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AudioRecordingHook {
  state: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  resetRecording: () => void;
  hasPermission: boolean;
}

export const useAudioRecording = (): AudioRecordingHook => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [hasPermission, setHasPermission] = useState(false);
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUri: null,
    isLoading: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request microphone permissions
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setHasPermission(status.granted);
        
        if (!status.granted) {
          Alert.alert(
            'Permission Required',
            'Microphone access is required to record audio notes. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error requesting recording permissions:', error);
        setState(prev => ({ ...prev, error: 'Failed to request microphone permissions' }));
      }
    })();
  }, []);

  // Start duration timer
  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    //@ts-ignore
    intervalRef.current = setInterval(() => {
      setState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  // Stop duration timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone access is required to record audio.');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        isLoading: false,
        duration: 0,
        audioUri: null 
      }));
      
      startTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to start recording' 
      }));
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Stop the recording
      await audioRecorder.stop();
      stopTimer();
      
      // According to expo-audio docs, the URI is available on audioRecorder.uri
      const uri = audioRecorder.uri;
      
      console.log('🎙️ Recording URI from audioRecorder.uri:', uri);
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false,
        isLoading: false,
        audioUri: uri
      }));

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to stop recording' 
      }));
      return null;
    }
  };

  const pauseRecording = async () => {
    try {
      await audioRecorder.pause();
      stopTimer();
      setState(prev => ({ ...prev, isPaused: true }));
    } catch (error) {
      console.error('Error pausing recording:', error);
      setState(prev => ({ ...prev, error: 'Failed to pause recording' }));
    }
  };

  const resumeRecording = async () => {
    try {
      await audioRecorder.record();
      startTimer();
      setState(prev => ({ ...prev, isPaused: false }));
    } catch (error) {
      console.error('Error resuming recording:', error);
      setState(prev => ({ ...prev, error: 'Failed to resume recording' }));
    }
  };

  const resetRecording = () => {
    stopTimer();
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUri: null,
      isLoading: false,
      error: null,
    });
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    hasPermission,
  };
};