import { useNotesService } from '@/features/quick-notes/api/notes.service';
import { TranscriptSegment } from '@/features/quick-notes/types/note';
import { useNoteAudioPlayer } from '@/features/shared/hooks';
import { formatDateAsTitle, formatFullDate, formatTime } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { API_BASEURL } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');



const PlaybackRateButton: React.FC<{
  rate: number;
  currentRate: number;
  onPress: () => void;
}> = ({ rate, currentRate, onPress }) => (
  <TouchableOpacity
    style={[
      styles.rateButton,
      currentRate === rate && styles.activeRateButton,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.rateButtonText,
        currentRate === rate && styles.activeRateButtonText,
      ]}
    >
      {rate}x
    </Text>
  </TouchableOpacity>
);

const TranscriptSegmentComponent: React.FC<{
  segment: TranscriptSegment;
  isActive: boolean;
  onPress: () => void;
}> = ({ segment, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.transcriptSegment, isActive && styles.activeSegment]}
    onPress={onPress}
  >
    <View style={styles.segmentHeader}>
      <Text style={styles.speakerName}>{segment.speaker}</Text>
      <Text style={styles.segmentTime}>
        {formatTime(segment.startTime)}
      </Text>
    </View>
    <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>
      {segment.text}
    </Text>
  </TouchableOpacity>
);

export default function NotePlayerScreen() {
  const { noteId, noteData } = useLocalSearchParams<{ noteId: string; noteData?: string }>();
  
  // Parse the note data if passed directly, otherwise fetch from API
  const parsedNote = noteData ? JSON.parse(noteData) : null;
  
  const { useNote } = useNotesService();
  const { data: fetchedNote, isLoading, error } = useNote(noteId!);
  
  // Use the passed note data or the fetched note
  const note = parsedNote || fetchedNote;
  
  // Construct the audio URL from the file field
  const audioUrl = `${API_BASEURL}/media/${note.file}`;
  
  const audioPlayer = useNoteAudioPlayer(audioUrl);
  const [showTranscript, setShowTranscript] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(1)).current;
  const [rateMenuIndex, setRateMenuIndex] = useState(2); // default 1x from [0.5,0.75,1,1.25,1.5,2]

  // Build transcript segments from stored speaker-labeled transcript if available
  let transcriptSegments: TranscriptSegment[] = [];
  try {
    const parsed = note?.rawTranscript ? JSON.parse(note.rawTranscript as any) : JSON.parse(note?.transcript || 'null');
    if (parsed && Array.isArray(parsed.transcription)) {
      transcriptSegments = parsed.transcription.map((item: Record<string, string>, index: number) => {
        const [speaker, text] = Object.entries(item)[0] || ['Speaker', ''];
        const startTime = index * 5; // fallback estimate per segment
        const endTime = startTime + Math.max(5, Math.min(30, Math.ceil((text?.split(' ')?.length || 5) * 0.6)));
        return { speaker, startTime, endTime, text } as TranscriptSegment;
      });
    }
  } catch (_) {}
  if (!transcriptSegments.length) {
    transcriptSegments = [
      {
        speaker: 'Speaker',
        startTime: 0,
        endTime: note?.transcript ? note.transcript.split(' ').length * 0.5 : 60,
        text: note?.transcript || 'No transcript available',
      },
    ];
  }

  const getCurrentSegment = () => {
    return transcriptSegments.find(
      segment =>
        audioPlayer.currentTime >= segment.startTime &&
        audioPlayer.currentTime <= segment.endTime
    );
  };

  const handleSeekToSegment = (startTime: number) => {
    audioPlayer.seekTo(startTime);
  };

  const handleShareNote = async () => {
    if (!note?.transcript) {
      return;
    }

    try {
      const shareContent = `Quick Note - ${formatDateAsTitle(note.createdAt)}\n\n${note.transcript}`;
      
      await Share.share({
        message: shareContent,
        title: `Quick Note - ${formatDateAsTitle(note.createdAt)}`,
      });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showTranscript ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showTranscript]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !note) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Note not found</Text>
          <Text style={styles.errorSubtitle}>This note may have been deleted or moved</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {formatDateAsTitle(note.createdAt)}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShareNote}>
          <Ionicons name="share-outline" size={24} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Album Art & Info */}
        <View style={styles.playerSection}>
          <LinearGradient
            colors={[note.thumbnailColor || PRIMARY, '#0f423f']}
            style={styles.albumArt}
          >
            <Ionicons name="mic" size={48} color="#fff" />
          </LinearGradient>
          
          <Text style={styles.noteTitle}>{formatDateAsTitle(note.createdAt)}</Text>
          
          <Text style={styles.noteDate}>
            {formatFullDate(note.createdAt)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={audioPlayer.duration}
            value={audioPlayer.currentTime}
            onValueChange={audioPlayer.seekTo}
            minimumTrackTintColor={PRIMARY}
            maximumTrackTintColor="#e5e7eb"
            //@ts-ignore
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>
              {formatTime(audioPlayer.currentTime)}
            </Text>
            <Text style={styles.timeLabel}>
              {formatTime(audioPlayer.duration)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <View style={[styles.speedPill, styles.speedPillPlaceholder]}>
            <Text style={styles.speedPillText}>{playbackRates[rateMenuIndex]}x</Text>
          </View>
          <View style={styles.controlsCenter}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => audioPlayer.seekTo(Math.max(0, audioPlayer.currentTime - 15))}
            >
              <Ionicons name="play-skip-back" size={24} color="#6b7280" />
              <Text style={styles.skipLabel}>15</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={audioPlayer.isPlaying ? audioPlayer.pause : audioPlayer.play}
            >
              {audioPlayer.isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={audioPlayer.isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#fff"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => audioPlayer.seekTo(Math.min(audioPlayer.duration, audioPlayer.currentTime + 15))}
            >
              <Ionicons name="play-skip-forward" size={24} color="#6b7280" />
              <Text style={styles.skipLabel}>15</Text>
            </TouchableOpacity>
          </View>

          {/* Speed toggle positioned separately */}
          <TouchableOpacity
            style={styles.speedPill}
            onPress={() => {
              const nextIndex = (rateMenuIndex + 1) % playbackRates.length;
              setRateMenuIndex(nextIndex);
              audioPlayer.setRate(playbackRates[nextIndex]);
            }}
          >
            <Text style={styles.speedPillText}>{playbackRates[rateMenuIndex]}x</Text>
          </TouchableOpacity>
        </View>

        {/* Removed dedicated playback rate section for a cleaner modern UX */}

        {/* Transcript Toggle */}
        <TouchableOpacity
          style={styles.transcriptToggle}
          onPress={() => setShowTranscript(!showTranscript)}
        >
          <Text style={styles.sectionTitle}>Transcript</Text>
          <Ionicons
            name={showTranscript ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6b7280"
          />
        </TouchableOpacity>

        {/* Transcript */}
        <Animated.View
          style={[
            styles.transcriptContainer,
            {
              opacity: slideAnim,
              maxHeight: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000],
              }),
            },
          ]}
        >
          {transcriptSegments.map((segment, index) => (
            <TranscriptSegmentComponent
              key={index}
              segment={segment}
              isActive={getCurrentSegment()?.startTime === segment.startTime}
              onPress={() => handleSeekToSegment(segment.startTime)}
            />
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  playerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  albumArt: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressSlider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: PRIMARY,
    width: 20,
    height: 20,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  controlsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    top: 30,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rateSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  rateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  activeRateButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeRateButtonText: {
    color: '#fff',
  },
  transcriptToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  speedPillPlaceholder: {
    opacity: 0,
  },
  speedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  transcriptContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  transcriptSegment: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  activeSegment: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: PRIMARY,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  segmentTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  segmentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  activeSegmentText: {
    color: '#1f2937',
    fontWeight: '500',
  },
}); 