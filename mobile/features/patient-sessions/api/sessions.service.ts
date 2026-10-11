import { TranscriptionService } from '@/features/quick-notes/api/transcription.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ConsolidatedNotesResponse,
    CreateSessionPayload,
    Session,
    SessionNotesPayload,
    UpdateNotePayload,
    UpdateTranscriptPayload
} from '../types/session';
import { SessionsAPI } from './sessions.api';

export const useSessionsService = () => {
  const queryClient = useQueryClient();

  const useSessions = (
    page: number = 1,
    limit: number = 50,
    startDate?: string,
    endDate?: string
  ) => {
    return useQuery({
      queryKey: ['sessions', page, limit, startDate, endDate],
      queryFn: () => SessionsAPI.getAllSessions(page, limit, startDate, endDate),
    });
  };

  const useSession = (id: string) => {
    return useQuery({
      queryKey: ['session', id],
      queryFn: () => SessionsAPI.getSessionById(id),
      enabled: !!id,
    });
  };

  const useCreateSession = () => {
    return useMutation({
      mutationFn: (payload: CreateSessionPayload) => SessionsAPI.createSession(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    });
  };

  const useUpdateSessionTranscript = () => {
    return useMutation({
      mutationFn: ({ sessionId, payload }: { sessionId: string; payload: UpdateTranscriptPayload }) =>
        SessionsAPI.updateSessionTranscript(sessionId, payload),
      onSuccess: (_, { sessionId }) => {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      },
    });
  };

  const useGenerateSessionNotes = () => {
    return useMutation({
      mutationFn: (payload: SessionNotesPayload) => SessionsAPI.generateSessionNotes(payload),
    });
  };

  const useUpdateSessionNote = () => {
    return useMutation({
      mutationFn: ({ sessionId, payload }: { sessionId: string; payload: UpdateNotePayload }) =>
        SessionsAPI.updateSessionNote(sessionId, payload),
      onSuccess: (_, { sessionId }) => {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      },
    });
  };

  const useCompleteSessionWorkflow = () => {
    return useMutation({
      mutationFn: async ({ 
        sessionId, 
        audioUri, 
        session,
        onProgress 
      }: { 
        sessionId: string;
        audioUri: string;
        session: Session;
        onProgress?: (progress: { step: string; message: string }) => void;
      }) => {
        try {
          // Step 1: Transcribe the audio (normalize Urdu to Hindi at source)
          onProgress?.({ step: 'transcribing', message: 'Transcribing audio...' });
          const transcriptionResult = await TranscriptionService.transcribeAudio(audioUri, session.language, (progress) => {
            onProgress?.({ step: 'transcribing', message: progress.message });
          });

          // Build sentences into speaker-labeled array and classify speakers
          const sentences = transcriptionResult.sentences;
          const speakerLabeled = TranscriptionService.createTranscription(sentences);
          let classified = speakerLabeled;
          try {
            const classification = await SessionsAPI.classifySpeakers({
              transcript: JSON.stringify(speakerLabeled),
              patientName: session.patientName,
              doctorName: 'Doctor',
              language: session.language
            });
            classified = classification.result || speakerLabeled;
          } catch (e) {
            console.warn('Speaker classification failed, continuing with raw labels:', e);
          }

          // If session language is Urdu, translate Hindi transcript -> Urdu while preserving speakers
          let finalSpeakerLabeled = classified;
          if (session.language === 'ur') {
            onProgress?.({ step: 'generating_notes', message: 'Translating transcript to Urdu...' });
            try {
              const translatePayload = {
                transcript: JSON.stringify(classified),
                sourceLanguage: 'hi',
                targetLanguage: 'ur'
              } as const;
              const translation = await SessionsAPI.translateHindiToUrdu(translatePayload);
              if (translation?.result?.transcription) {
                finalSpeakerLabeled = translation.result;
              }
            } catch (e) {
              console.error('Urdu translation failed, proceeding with original transcript:', e);
            }
          }

          // Step 2: Generate session notes using consolidated endpoint
          onProgress?.({ step: 'generating_notes', message: 'Generating notes...' });
          
          // Ensure noteFormat is a string
          const noteFormatString = String(session.noteFormat || '');
          console.log('📝 Session noteFormat:', session.noteFormat, '-> converted to string:', noteFormatString);
          
          const notesPayload: SessionNotesPayload = {
            transcript: JSON.stringify(finalSpeakerLabeled),
            patient: session.patientName,
            sex: session.sex || '',
            noteFormat: noteFormatString,
            sessionType: session.sessionType,
            notes: '',
            language: session.language,
          };
          const consolidatedResponse: ConsolidatedNotesResponse = await SessionsAPI.generateSessionNotes(notesPayload);

          // Step 3: Save everything using consolidated endpoint
          onProgress?.({ step: 'saving_all', message: 'Saving session details...' });
          
          const assemblyId = transcriptionResult.id || `session-${sessionId}-${Date.now()}`;
          
          console.log('🔄 About to call updateSessionDetails with sessionId:', sessionId);
          console.log('📊 Consolidated response:', consolidatedResponse);
          
          const sessionDetailsData = {
            summary: consolidatedResponse.summary,
            doctorNotes: consolidatedResponse.sessionNotes,
            diagnosisCodes: consolidatedResponse.diagnosis,
            transcript: {
              assemblyId,
              content: JSON.stringify(finalSpeakerLabeled),
              duration: 0.1,
            },
            cost: {
              patient: session.patientName,
              doctor: 'Doctor', // This should come from user context
              totalInputTokens: consolidatedResponse.tokenUsage.input,
              totalOutputTokens: consolidatedResponse.tokenUsage.output,
              totalTokens: consolidatedResponse.tokenUsage.total,
              totalInputCost: consolidatedResponse.cost.input,
              totalOutputCost: consolidatedResponse.cost.output,
              totalSessionCost: consolidatedResponse.cost.total,
              operations: ['Speaker Classification', 'Consolidated Session Notes'],
            },
            sessionAudio: audioUri,
            noteFormat: noteFormatString, // Add the noteFormat field
          };
          
          console.log('📤 Session details data to send:', sessionDetailsData);
          
          try {
            await SessionsAPI.updateSessionDetails(sessionId, sessionDetailsData);
            console.log('✅ Successfully called updateSessionDetails');
          } catch (error) {
            console.error('❌ Error calling updateSessionDetails:', error);
            throw error;
          }

          onProgress?.({ step: 'complete', message: 'Session completed successfully!' });
          return { 
            sessionId, 
            notes: consolidatedResponse.sessionNotes,
            diagnosis: consolidatedResponse.diagnosis,
            summary: consolidatedResponse.summary
          };
        } catch (error) {
          console.error('Error in session workflow:', error);
          throw error;
        }
      },
      onSuccess: (_, { sessionId }) => {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    });
  };

  const useApproveSession = () => {
    return useMutation({
      mutationFn: (sessionId: string) => SessionsAPI.approveSession(sessionId),
      onSuccess: (_, sessionId) => {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    });
  };

  return {
    useSessions,
    useSession,
    useCreateSession,
    useUpdateSessionTranscript,
    useGenerateSessionNotes,
    useUpdateSessionNote,
    useCompleteSessionWorkflow,
    useApproveSession,
  };
};

export default useSessionsService; 