import { SessionsAPI } from '@/features/patient-sessions/api/sessions.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Note } from '../types/note';
import { CreateNotePayload, NotesAPI } from './notes.api';
import { ProgressCallback, TranscriptionService } from './transcription.service';

export const useNotesService = () => {
  const queryClient = useQueryClient();

  const useNotes = () => {
    return useQuery({
      queryKey: ['notes'],
      queryFn: NotesAPI.getAllNotes,
    });
  };

  const useNote = (id: string) => {
    return useQuery({
      queryKey: ['note', id],
      queryFn: () => NotesAPI.getNoteById(id),
      enabled: !!id,
    });
  };

  const useCreateNoteWithTranscription = () => {
    return useMutation({
      mutationFn: async ({ 
        audioUri, 
        title, 
        description, 
        languageCode,
        onProgress 
      }: { 
        audioUri: string; 
        title: string; 
        description?: string; 
        languageCode?: string;
        onProgress?: ProgressCallback;
      }) => {
        console.log('🎵 useCreateNoteWithTranscription called');
        console.log('🎵 Audio URI:', audioUri);
        console.log('🎵 Title:', title);
        console.log('🎵 Description:', description);
        console.log('🎵 Language Code:', languageCode);
        
        try {
          // Step 1: Transcribe the audio with progress tracking
          console.log('🎵 Step 1: Starting transcription...');
          const transcriptionResult = await TranscriptionService.transcribeAudio(audioUri, languageCode, onProgress);
          console.log('🎵 Transcription completed:', transcriptionResult.transcript.length, 'characters');

          // Step 2: Build speaker-labeled transcript from sentences
          console.log('🎵 Step 2: Building speaker-labeled transcript...');
          const speakerLabeled = TranscriptionService.createTranscription(transcriptionResult.sentences);

          // Step 3: Use original speaker labels (no doctor/patient classification for Quick Notes)
          console.log('🎵 Step 3: Using original speaker labels (no classification)...');
          let finalSpeakerLabeled = speakerLabeled;

          // Step 4: If Urdu, translate Hindi transcript -> Urdu while preserving speakers
          console.log('🎵 Step 4: Handling Urdu translation (if applicable)...');
          if (languageCode === 'ur') {
            try {
              const translation = await SessionsAPI.translateHindiToUrdu({
                transcript: JSON.stringify(finalSpeakerLabeled),
                sourceLanguage: 'hi',
                targetLanguage: 'ur',
              });
              if (translation?.result?.transcription) {
                finalSpeakerLabeled = translation.result;
              }
            } catch (e) {
              console.error('Urdu translation failed, proceeding with original transcript:', e);
            }
          }

          // Step 5: Create the note payload with full speaker-labeled transcript JSON
          console.log('🎵 Step 5: Creating note payload...');
          const payload: CreateNotePayload = {
            title,
            description,
            audioUri: audioUri,
            transcript: JSON.stringify(finalSpeakerLabeled),
          };
          console.log('🎵 Payload created:', payload);

          // Step 6: Create the note (will handle blob conversion internally)
          console.log('🎵 Step 6: Saving note to API...');
          const result = await NotesAPI.createNote(payload);
          console.log('🎵 Note saved successfully:', result.id);
          
          return result;
        } catch (error) {
          console.error('❌ Error in useCreateNoteWithTranscription:', error);
          throw error;
        }
      },
      onSuccess: () => {
        console.log('🎵 Mutation succeeded, invalidating queries...');
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      },
      onError: (error) => {
        console.error('❌ Mutation failed:', error);
      },
    });
  };

  const useCreateNote = () => {
    return useMutation({
      mutationFn: (payload: CreateNotePayload) => NotesAPI.createNote(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      },
    });
  };

  const useUpdateNote = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
        NotesAPI.updateNote(id, updates),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      },
    });
  };

  const useDeleteNote = () => {
    return useMutation({
      mutationFn: (id: string) => NotesAPI.deleteNote(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      },
    });
  };

  const useTranscribeAudio = () => {
    return useMutation({
      mutationFn: ({ audioUri, languageCode, onProgress }: { 
        audioUri: string; 
        languageCode?: string; 
        onProgress?: ProgressCallback;
      }) =>
        TranscriptionService.transcribeAudio(audioUri, languageCode, onProgress),
    });
  };

  return {
    useNotes,
    useNote,
    useCreateNote,
    useCreateNoteWithTranscription,
    useUpdateNote,
    useDeleteNote,
    useTranscribeAudio,
  };
};

export default useNotesService;
