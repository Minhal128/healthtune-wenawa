import { MOCK_NOTES } from '@/features/shared/mock/fixtures';
import axios from '@/utils/config/axios-instance';
import { API_BASEURL, MOCK_MODE } from '@/utils/constants';
import { Note } from '../types/note';

const THUMBNAIL_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#EC4899',
  '#6366F1',
];

const getRandomColor = (): string => {
  return THUMBNAIL_COLORS[Math.floor(Math.random() * THUMBNAIL_COLORS.length)];
};

export interface CreateNotePayload {
  title: string;
  description?: string;
  audioUri: string;
  transcript: string;
}

export const NotesAPI = {
  getAllNotes: async (): Promise<Note[]> => {
    if (MOCK_MODE) {
      return MOCK_NOTES;
    }
    try {
      const response = await axios.get('/quick-notes/', {
        params: {
          page: 1,
          limit: 50,
          sort: 'DESC'
        }
      });
      
      // The API returns { message, data, page, total, lastPage }
      const notes = response.data.data || [];
      return notes.map((note: any) => {
        // If transcript is stored as JSON string with speaker labels, derive preview text
        let transcriptText: string = note.transcript || '';
        let speakers: any[] | undefined = note.speakers;
        try {
          const parsed = typeof note.transcript === 'string' ? JSON.parse(note.transcript) : note.transcript;
          if (parsed && Array.isArray(parsed.transcription)) {
            const lines: string[] = [];
            parsed.transcription.forEach((item: Record<string, string>) => {
              const [speakerKey, text] = Object.entries(item)[0] || [];
              if (speakerKey && text) {
                lines.push(`${speakerKey}: ${text}`);
              }
            });
            if (lines.length) transcriptText = lines.join('\n');
          }
        } catch (_) {
          // leave transcriptText as-is
        }

        return {
          ...note,
          id: note.id.toString(),
          thumbnailColor: getRandomColor(),
          audioUrl: `${API_BASEURL.replace(/\/api\/?$/, '')}/media/${note.file}`,
          transcript: transcriptText,
          rawTranscript: typeof note.transcript === 'string' ? note.transcript : JSON.stringify(note.transcript),
          speakers,
        } as Note;
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  getNoteById: async (id: string): Promise<Note | null> => {
    if (MOCK_MODE) {
      return MOCK_NOTES.find((note) => String(note.id) === id) || MOCK_NOTES[0];
    }
    try {
      const response = await axios.get(`/quick-notes/${id}`);
      const raw = response.data.data || response.data;
      let transcriptText: string = raw.transcript || '';
      try {
        const parsed = typeof raw.transcript === 'string' ? JSON.parse(raw.transcript) : raw.transcript;
        if (parsed && Array.isArray(parsed.transcription)) {
          const lines: string[] = [];
          parsed.transcription.forEach((item: Record<string, string>) => {
            const [speakerKey, text] = Object.entries(item)[0] || [];
            if (speakerKey && text) {
              lines.push(`${speakerKey}: ${text}`);
            }
          });
          if (lines.length) transcriptText = lines.join('\n');
        }
      } catch (_) {}

      const note: Note = {
        ...raw,
        transcript: transcriptText,
        rawTranscript: typeof raw.transcript === 'string' ? raw.transcript : JSON.stringify(raw.transcript),
        thumbnailColor: raw.thumbnailColor || getRandomColor(),
      };
      return note;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  },

  createNote: async (payload: CreateNotePayload): Promise<Note> => {
    if (MOCK_MODE) {
      return {
        id: String(Date.now()),
        title: payload.title,
        description: payload.description,
        file: 'mock-recording.m4a',
        audioUrl: payload.audioUri,
        duration: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transcript: payload.transcript,
        speakers: [],
        thumbnailColor: getRandomColor(),
      };
    }
    try {
      console.log('🎵 NotesAPI.createNote called with payload:', {
        title: payload.title,
        description: payload.description,
        audioUri: payload.audioUri,
        transcriptLength: payload.transcript.length
      });

      // Create FormData with React Native file format
      const formData = new FormData();
      
      // Add transcript (JSON string if speaker-labeled)
      console.log('📝 Adding transcript to form data...');
      formData.append('transcript', payload.transcript);
      
      // if (payload.title) {
      //   formData.append('title', payload.title);
      // }
      // if (payload.description) {
      //   formData.append('description', payload.description);
      // }
      
      // Add audio file using React Native format
      console.log('🎵 Adding audio file to FormData in React Native format...');
      formData.append('file', {
        uri: payload.audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      
      console.log('🚀 Sending multipart form data to backend...');
      const response = await axios.post('/quick-notes/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });
      
      const newNote = response.data.data || response.data;
      return {
        ...newNote,
        thumbnailColor: newNote.thumbnailColor || getRandomColor()
      };
    } catch (error: any) {
      console.error('❌ Error creating note:', error);
      if (error.response) {
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('❌ Request was made but no response received:', error.request);
      } else {
        console.error('❌ Error setting up request:', error.message);
      }
      throw new Error(`Failed to create note: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },

  updateNote: async (id: string, updates: Partial<Note>): Promise<Note | null> => {
    try {
      const response = await axios.patch(`/quick-notes/${id}`, updates);
      const updatedNote = response.data.data || response.data;
      return {
        ...updatedNote,
        thumbnailColor: updatedNote.thumbnailColor || getRandomColor()
      };
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  },

  deleteNote: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`/quick-notes/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  },
};
export default NotesAPI;

