import { useSessionsService } from '@/features/patient-sessions/api/sessions.service';
import { GradientHeader } from '@/features/shared/components';
import { useNoteAudioPlayer } from '@/features/shared/hooks';
import { formatFullDate, formatTime, formatTimeFromDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { API_BASEURL, getLanguageByCode } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    BackHandler,
    Dimensions,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

// Move Animated.Value outside component to prevent recreation on every render
const playerSlideAnim = new Animated.Value(0);



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#10b981';
    case 'process':
      return '#f59e0b';
    case 'pending':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

// Memoize the MarkdownRenderer component
const MarkdownRenderer = React.memo<{ content: string }>(({ content }) => {
  const markdownStyles = React.useMemo(() => ({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: '#374151',
    },
    heading1: {
      fontSize: 24,
      fontWeight: '600',
      color: '#1f2937',
      marginTop: 24,
      marginBottom: 12,
    },
    heading2: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1f2937',
      marginTop: 20,
      marginBottom: 10,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 12,
    },
    strong: {
      fontWeight: '600',
      color: '#1f2937',
    },
    em: {
      fontStyle: 'italic',
    },
    list_item: {
      marginVertical: 4,
    },
    code_inline: {
      backgroundColor: '#f3f4f6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: '#f9fafb',
      padding: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: PRIMARY,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: '#e5e7eb',
      paddingLeft: 16,
      marginVertical: 16,
      fontStyle: 'italic',
      color: '#6b7280',
    },
  }), []);

  return (
    <Markdown style={markdownStyles as any}>
      {content}
    </Markdown>
  );
});

const parseTranscript = (transcriptString: string) => {
  try {
    const parsed = JSON.parse(transcriptString);
    if (parsed.transcription && Array.isArray(parsed.transcription)) {
      return parsed.transcription.map((item: any) => {
        const key = Object.keys(item)[0];
        return {
          speaker: key,
          text: item[key],
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error parsing transcript:', error);
    return [{ speaker: 'Unknown', text: transcriptString }];
  }
};

const parseDiagnosisCodes = (diagnosisString: string) => {
  try {
    const parsed = JSON.parse(diagnosisString);
    return {
      icd10Codes: parsed.icd10Codes || [],
      atcCodes: parsed.atcCodes || [],
    };
  } catch (error) {
    console.error('Error parsing diagnosis codes:', error);
    return {
      icd10Codes: [],
      atcCodes: [],
    };
  }
};

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { useSession, useApproveSession } = useSessionsService();
  const { data: session, isLoading, error } = useSession(id || '');
  const approveSessionMutation = useApproveSession();
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript' | 'diagnosis'>('notes');
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = useState(2); // Default to 1x (index 2)

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
  // Memoize expensive computations
  const audioUrl = React.useMemo(() => 
    session?.audioFile ? `${API_BASEURL}/media/${session.audioFile}` : undefined, 
    [session?.audioFile]
  );
  
  const audioPlayer = useNoteAudioPlayer(audioUrl);
  
  // Memoize status color
  const statusColor = React.useMemo(() => 
    session ? getStatusColor(session.status) : '#6b7280', 
    [session?.status]
  );
  
  // Memoize transcript data
  const transcriptData = React.useMemo(() => 
    session?.transcript ? parseTranscript(session.transcript.content.transcript) : [], 
    [session?.transcript?.content.transcript]
  );
  
  // Memoize language direction for RTL support
  const isRTL = React.useMemo(() => {
    if (!session?.language) return false;
    const language = getLanguageByCode(session.language);
    return language.direction === 'rtl';
  }, [session?.language]);
  
  // Memoize diagnosis data
  const diagnosisData = React.useMemo(() => 
    session?.diagnosisCodes?.content?.note ? parseDiagnosisCodes(session.diagnosisCodes.content.note) : { icd10Codes: [], atcCodes: [] }, 
    [session?.diagnosisCodes?.content?.note]
  );
  
  // Memoize callbacks
  const handleClose = React.useCallback(() => {
    router.push('/(tabs)/session-history');
  }, []);
  
  const handleCardToggle = React.useCallback(() => {
    setIsCardExpanded(prev => !prev);
  }, []);
  
  const handleTabChange = React.useCallback((tab: 'notes' | 'transcript' | 'diagnosis') => {
    setActiveTab(tab);
  }, []);
  
  const handleSeekBackward = React.useCallback(() => {
    audioPlayer.seekTo(Math.max(0, audioPlayer.currentTime - 15));
  }, [audioPlayer]);
  
  const handleSeekForward = React.useCallback(() => {
    audioPlayer.seekTo(Math.min(audioPlayer.duration, audioPlayer.currentTime + 15));
  }, [audioPlayer]);
  
  const handlePlayPause = React.useCallback(() => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  }, [audioPlayer.isPlaying, audioPlayer.play, audioPlayer.pause]);

  const handleFloatingButtonPress = React.useCallback(() => {
    setShowFloatingButton(false);
    setShowAudioPlayer(true);
    Animated.timing(playerSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCloseAudioPlayer = React.useCallback(() => {
    setShowAudioPlayer(false);
    setShowFloatingButton(true);
    playerSlideAnim.setValue(0);
  }, []);

  const handlePlaybackRateToggle = React.useCallback(() => {
    const nextIndex = (playbackRateIndex + 1) % playbackRates.length;
    setPlaybackRateIndex(nextIndex);
    audioPlayer.setRate(playbackRates[nextIndex]);
  }, [playbackRateIndex, playbackRates, audioPlayer]);

  const handleShareNotes = React.useCallback(async () => {
    if (!session?.doctorNotes?.content.note) {
      return;
    }

    try {
      const shareContent = `Session Notes - ${session.patientName}\n\n${session.doctorNotes.content.note}`;
      
      await Share.share({
        message: shareContent,
        title: `Session Notes - ${session.patientName}`,
      });
    } catch (error) {
      console.error('Error sharing notes:', error);
    }
  }, [session?.doctorNotes?.content.note, session?.patientName]);

  const handleShareTranscript = React.useCallback(async () => {
    if (!transcriptData.length) {
      return;
    }

    try {
      const transcriptText = transcriptData
        .map((item: any) => `${item.speaker}: ${item.text}`)
        .join('\n\n');
      
      const shareContent = `Session Transcript - ${session?.patientName}\n\n${transcriptText}`;
      
      await Share.share({
        message: shareContent,
        title: `Session Transcript - ${session?.patientName}`,
      });
    } catch (error) {
      console.error('Error sharing transcript:', error);
    }
  }, [transcriptData, session?.patientName]);

  const handleShareDiagnosis = React.useCallback(async () => {
    if (!diagnosisData.icd10Codes.length && !diagnosisData.atcCodes.length) {
      return;
    }

    try {
      let diagnosisText = `Diagnosis Codes - ${session?.patientName}\n\n`;
      
      if (diagnosisData.icd10Codes.length > 0) {
        diagnosisText += 'ICD-10 Codes:\n';
        diagnosisData.icd10Codes.forEach((code: any) => {
          diagnosisText += `• ${code.code}: ${code.description}\n`;
        });
        diagnosisText += '\n';
      }
      
      if (diagnosisData.atcCodes.length > 0) {
        diagnosisText += 'ATC Codes:\n';
        diagnosisData.atcCodes.forEach((code: any) => {
          diagnosisText += `• ${code.code}: ${code.medicineName}\n`;
        });
      }
      
      await Share.share({
        message: diagnosisText,
        title: `Diagnosis Codes - ${session?.patientName}`,
      });
    } catch (error) {
      console.error('Error sharing diagnosis codes:', error);
    }
  }, [diagnosisData, session?.patientName]);

  const handleApproveSession = React.useCallback(() => {
    if (!id) return;

    Alert.alert(
      'Approve Session',
      'Are you sure you want to approve this session? This action confirms the consultation is finalized.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await approveSessionMutation.mutateAsync(id);
              Alert.alert('Success', 'Session approved successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve session. Please try again.');
              console.error('Error approving session:', error);
            }
          },
        },
      ]
    );
  }, [id, approveSessionMutation]);
  
  useEffect(() => {
    if (session?.audioFile) {
      setShowFloatingButton(true);
      setShowAudioPlayer(false);
      playerSlideAnim.setValue(0);
    } else {
      setShowFloatingButton(false);
      setShowAudioPlayer(false);
      playerSlideAnim.setValue(0);
    }
  }, [session?.audioFile]);
  
  // Handle hardware back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Navigate to session history instead of going back
      router.push('/(tabs)/session-history');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Session Details" onClose={handleClose} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Session Details" onClose={handleClose} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Session not found</Text>
          <Text style={styles.errorMessage}>
            This session may have been deleted or you don't have access to it.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Session Details" onClose={handleClose} />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={showAudioPlayer ? styles.contentWithPlayer : undefined}
      >
        {/* Approve Button - Shows when status is Completed */}
        {session.status.toLowerCase() === 'completed' && (
          <View style={styles.approveButtonContainer}>
            <TouchableOpacity
              style={[styles.approveButton, approveSessionMutation.isPending && styles.approveButtonDisabled]}
              onPress={handleApproveSession}
              disabled={approveSessionMutation.isPending}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={approveSessionMutation.isPending ? ['#9ca3af', '#6b7280'] : [PRIMARY, '#0f423f']}
                style={styles.approveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {approveSessionMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                )}
                <Text style={styles.approveButtonText}>
                  {approveSessionMutation.isPending ? 'Approving...' : 'Approve Session'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Session Overview */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#ffffff', '#f9fafb']}
            style={styles.overviewCard}
          >
            {/* Status Badge - Fixed in top right */}
            <View style={[styles.statusBadgeFixed, { backgroundColor: `${statusColor}15`, borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {session.status}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={handleCardToggle}
              activeOpacity={0.7}
            >
              <View style={styles.patientInfo}>
                <LinearGradient
                  colors={[PRIMARY, '#0f423f']}
                  style={styles.avatar}
                >
                  <Ionicons name="person" size={24} color="#ffffff" />
                </LinearGradient>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{session.patientName}</Text>
                  <Text style={styles.sessionType}>{session.sessionType}</Text>
                  {session.patient && (
                    <Text style={styles.mreNumber}>{session.patient.mreNumber}</Text>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                <Ionicons 
                  name={isCardExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {isCardExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.sessionMeta}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{formatFullDate(session.createdAt)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{formatTimeFromDate(session.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="medical" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{session.noteFormat}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="language" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{session.language}</Text>
                    </View>
                  </View>
                  {session.duration && (
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="stopwatch" size={16} color="#6b7280" />
                        <Text style={styles.metaText}>{session.duration} minutes</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
            onPress={() => handleTabChange('notes')}
          >
            <Ionicons 
              name="medical" 
              size={20} 
              color={activeTab === 'notes' ? PRIMARY : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
              Notes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transcript' && styles.activeTab]}
            onPress={() => handleTabChange('transcript')}
          >
            <Ionicons 
              name="chatbubbles" 
              size={20} 
              color={activeTab === 'transcript' ? PRIMARY : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>
              Transcript
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diagnosis' && styles.activeTab]}
            onPress={() => handleTabChange('diagnosis')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={activeTab === 'diagnosis' ? PRIMARY : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'diagnosis' && styles.activeTabText]}>
              Diagnosis
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'notes' && (
            <View style={styles.contentCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Session Notes</Text>
                {session.doctorNotes?.content.note && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareNotes}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={20} color={PRIMARY} />
                  </TouchableOpacity>
                )}
              </View>
              {session.doctorNotes?.content.note ? (
                <View style={styles.markdownContainer}>
                  <MarkdownRenderer content={session.doctorNotes.content.note} />
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="medical-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No notes available</Text>
                  <Text style={styles.emptyMessage}>
                    Session notes will appear here once generated
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'transcript' && (
            <View style={styles.contentCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Session Transcript</Text>
                {transcriptData.length > 0 && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareTranscript}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={20} color={PRIMARY} />
                  </TouchableOpacity>
                )}
              </View>
              {transcriptData.length > 0 ? (
                <View style={[styles.transcriptContainer, isRTL && styles.transcriptContainerRTL]}>
                  {transcriptData.map((item: any, index: any) => (
                    <View key={index} style={[styles.transcriptItem, isRTL && styles.transcriptItemRTL]}>
                      <View style={[styles.speakerBadge, isRTL && styles.speakerBadgeRTL]}>
                        <Text style={[styles.speakerText, isRTL && styles.speakerTextRTL]}>{item.speaker}</Text>
                      </View>
                      <Text style={[styles.transcriptText, isRTL && styles.transcriptTextRTL]}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="mic-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No transcript available</Text>
                  <Text style={styles.emptyMessage}>
                    Session transcript will appear here once processed
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'diagnosis' && (
            <View style={styles.contentCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Diagnosis Codes</Text>
                {(diagnosisData.icd10Codes.length > 0 || diagnosisData.atcCodes.length > 0) && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareDiagnosis}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={20} color={PRIMARY} />
                  </TouchableOpacity>
                )}
              </View>
              {session.diagnosisCodes?.content.note ? (
                <View style={styles.diagnosisContainer}>
                  {diagnosisData.icd10Codes.length > 0 && (
                          <View style={styles.diagnosisSection}>
                            <View style={styles.diagnosisSectionHeader}>
                              <Ionicons name="medical" size={20} color={PRIMARY} />
                              <Text style={styles.diagnosisSectionTitle}>ICD-10 Codes</Text>
                              <View style={styles.diagnosisCount}>
                                <Text style={styles.diagnosisCountText}>{diagnosisData.icd10Codes.length}</Text>
                              </View>
                            </View>
                            <View style={styles.diagnosisGrid}>
                              {diagnosisData.icd10Codes.map((code: { code: string; description: string }, index: number) => (
                                <View key={index} style={styles.diagnosisCard}>
                                  <LinearGradient
                                    colors={[PRIMARY, '#0f423f']}
                                    style={styles.diagnosisCardAccent}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                  />
                                  <View style={styles.diagnosisCardHeader}>
                                    <Text style={styles.diagnosisCode}>{code.code}</Text>
                                    <View style={[styles.diagnosisTypeBadge, { backgroundColor: `${PRIMARY}15` }]}>
                                      <Text style={styles.diagnosisTypeText}>ICD-10</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.diagnosisDescription}>{code.description}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        {diagnosisData.atcCodes.length > 0 && (
                          <View style={styles.diagnosisSection}>
                            <View style={styles.diagnosisSectionHeader}>
                              <Ionicons name="flask" size={20} color="#8b5cf6" />
                              <Text style={styles.diagnosisSectionTitle}>ATC Codes</Text>
                              <View style={[styles.diagnosisCount, { backgroundColor: '#8b5cf615' }]}>
                                <Text style={[styles.diagnosisCountText, { color: '#8b5cf6' }]}>{diagnosisData.atcCodes.length}</Text>
                              </View>
                            </View>
                            <View style={styles.diagnosisGrid}>
                              {diagnosisData.atcCodes.map((code: { code: string; medicineName: string }, index: number) => (
                                <View key={index} style={styles.diagnosisCard}>
                                  <LinearGradient
                                    colors={['#8b5cf6', '#7c3aed']}
                                    style={styles.diagnosisCardAccent}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                  />
                                  <View style={styles.diagnosisCardHeader}>
                                    <Text style={[styles.diagnosisCode, { color: '#8b5cf6' }]}>{code.code}</Text>
                                    <View style={[styles.diagnosisTypeBadge, { backgroundColor: '#8b5cf615' }]}>
                                      <Text style={[styles.diagnosisTypeText, { color: '#8b5cf6' }]}>ATC</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.diagnosisDescription}>{code.medicineName}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        {diagnosisData.icd10Codes.length === 0 && diagnosisData.atcCodes.length === 0 && (
                          <View style={styles.emptyDiagnosis}>
                            <Ionicons name="list-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyTitle}>No diagnosis codes available</Text>
                            <Text style={styles.emptyMessage}>
                              Diagnosis codes will appear here once generated
                            </Text>
                          </View>
                        )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="list-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No diagnosis codes available</Text>
                  <Text style={styles.emptyMessage}>
                    Diagnosis codes will appear here once generated
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

              {/* Fixed Bottom Audio Player */}
        {showAudioPlayer && (
          <Animated.View 
            style={[
              styles.audioPlayerContainer,
              {
                transform: [{
                  translateY: playerSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.audioPlayerGradient}
            >
              {/* Header with Close Button */}
              <View style={styles.audioPlayerHeader}>
                <Text style={styles.audioPlayerTitle}>Session Audio</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseAudioPlayer}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
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
                />
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(audioPlayer.currentTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(audioPlayer.duration)}</Text>
                </View>
              </View>

              {/* Player Controls */}
              <View style={styles.controlsSection}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleSeekBackward}
                >
                  <Ionicons name="play-skip-back" size={20} color="#6b7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                  disabled={audioPlayer.isLoading}
                >
                  {audioPlayer.isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons
                      name={audioPlayer.isPlaying ? 'pause' : 'play'}
                      size={28}
                      color="#ffffff"
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleSeekForward}
                >
                  <Ionicons name="play-skip-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Playback Rate Toggle */}
              <View style={styles.playbackRateSection}>
                <TouchableOpacity
                  style={styles.playbackRateButton}
                  onPress={handlePlaybackRateToggle}
                >
                  <Text style={styles.playbackRateText}>{playbackRates[playbackRateIndex]}x</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Floating Play Button */}
        {showFloatingButton && session?.audioFile && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleFloatingButtonPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[PRIMARY, '#0f423f']}
              style={styles.floatingButtonGradient}
            >
              <Ionicons name="play" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  contentWithPlayer: {
    paddingBottom: 100, // Reduced padding for the more compact player
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
  backButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  overviewCard: {
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 16,
    color: '#6b7280',
  },
  mreNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandedContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeFixed: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 1,
    zIndex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sessionMeta: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: PRIMARY,
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 20,
    paddingBottom: 100,
  },
  contentCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  markdownContainer: {
    minHeight: 200,
  },
  transcriptContainer: {
    gap: 16,
  },
  transcriptContainerRTL: {
    alignItems: 'flex-end',
  },
  transcriptItem: {
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    paddingLeft: 16,
    paddingVertical: 8,
  },
  transcriptItemRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: PRIMARY,
    paddingLeft: 0,
    paddingRight: 16,
    alignItems: 'flex-end',
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${PRIMARY}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  speakerBadgeRTL: {
    alignSelf: 'flex-end',
  },
  speakerText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
    textTransform: 'uppercase',
  },
  speakerTextRTL: {
    textAlign: 'right',
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  transcriptTextRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  patientInfoContainer: {
    gap: 16,
  },
  infoGroup: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  diagnosisContainer: {
    gap: 20,
  },
  diagnosisSection: {
    gap: 12,
  },
  diagnosisSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  diagnosisSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  diagnosisCount: {
    backgroundColor: `${PRIMARY}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  diagnosisCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  diagnosisGrid: {
    gap: 16,
  },
  diagnosisCard: {
    width: '100%', // Full width
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  diagnosisCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  diagnosisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisCode: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    fontFamily: 'monospace',
  },
  diagnosisTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diagnosisTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
    textTransform: 'uppercase',
  },
  diagnosisDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyDiagnosis: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  audioPlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  audioPlayerGradient: {
    padding: 20,
    borderRadius: 20,
  },
  audioPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioPlayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressSlider: {
    height: 30,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  playbackRateSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  playbackRateButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  playbackRateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  approveButtonContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  approveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  approveButtonDisabled: {
    opacity: 0.7,
  },
  approveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  approveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
}); 