import {
  MOCK_CONSOLIDATED_NOTES,
  MOCK_SESSION,
  MOCK_SESSION_DETAILS,
  MOCK_SESSIONS_RESPONSE,
} from '@/features/shared/mock/fixtures';
import axios from '@/utils/config/axios-instance';
import { MOCK_MODE } from '@/utils/constants';
import {
  ConsolidatedNotesResponse,
  CreateSessionPayload,
  CreateSessionResponse,
  Diagnosis,
  Session,
  SessionDetails,
  SessionDetailsResponse,
  SessionDetailsUpdateData,
  SessionNotesPayload,
  SessionsResponse,
  UpdateNotePayload,
  UpdateTranscriptPayload,
} from '../types/session';

export const SessionsAPI = {
  getAllSessions: async (
    page: number = 1,
    limit: number = 50,
    startDate?: string,
    endDate?: string
  ): Promise<SessionsResponse> => {
    if (MOCK_MODE) {
      return MOCK_SESSIONS_RESPONSE;
    }
    try {
      const params: Record<string, any> = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get<SessionsResponse>('/session', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw new Error('Failed to fetch sessions');
    }
  },

  createSession: async (payload: CreateSessionPayload): Promise<Session> => {
    if (MOCK_MODE) {
      return {
        ...MOCK_SESSION,
        id: Date.now(),
        patientId: Number(payload.patientId) || MOCK_SESSION.patientId,
        sex: payload.sex,
        sessionType: payload.sessionType,
        noteFormat: payload.noteFormat,
        language: payload.language,
        status: 'In Progress',
        note: null,
        transcript: null,
      };
    }
    try {
      const response = await axios.post<CreateSessionResponse>('/session', payload);
      return response.data.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  },

  getSessionById: async (id: string): Promise<SessionDetails | null> => {
    if (MOCK_MODE) {
      return { ...MOCK_SESSION_DETAILS, id: Number(id) || MOCK_SESSION_DETAILS.id };
    }
    try {
      const response = await axios.get<SessionDetailsResponse>(`/session/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw new Error('Failed to fetch session');
    }
  },

  updateSessionTranscript: async (sessionId: string, payload: UpdateTranscriptPayload): Promise<boolean> => {
    if (MOCK_MODE) {
      return true;
    }
    try {
      await axios.put(`/session/${sessionId}/transcript`, payload);
      return true;
    } catch (error) {
      console.error('Error updating session transcript:', error);
      throw new Error('Failed to update session transcript');
    }
  },

  generateSessionNotes: async (payload: SessionNotesPayload): Promise<ConsolidatedNotesResponse> => {
    if (MOCK_MODE) {
      return MOCK_CONSOLIDATED_NOTES;
    }
    try {
      // Call the consolidated Next.js AI backend
      const response = await axios.post('https://dev-app.healthtune.io/api/session-notes/consolidated', payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // The response should be JSON with sessionNotes, diagnosis, summary, tokenUsage, and cost
      return response.data;
    } catch (error) {
      console.error('Error generating session notes:', error);
      throw new Error('Failed to generate session notes');
    }
  },

  // Translate Hindi transcript JSON (speaker-labelled) into Urdu using Next.js BE
  translateHindiToUrdu: async (
    payload: { transcript: string; sourceLanguage?: string; targetLanguage?: string }
  ): Promise<{ result: { transcription: Array<Record<string, string>> } } > => {
    if (MOCK_MODE) {
      return { result: { transcription: [{ A: 'Mock Urdu transcript line.' }] } };
    }
    try {
      const response = await axios.post(
        'https://dev-app.healthtune.io/api/transcription/translate-ur',
        {
          transcript: payload.transcript,
          sourceLanguage: payload.sourceLanguage || 'hi',
          targetLanguage: payload.targetLanguage || 'ur'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error translating transcript to Urdu:', error);
      throw new Error('Failed to translate transcript to Urdu');
    }
  },

  // Classify speakers using Next.js BE route (maps A/B to doctor/patient initials)
  classifySpeakers: async (
    payload: { transcript: string; patientName: string; doctorName: string; language?: string }
  ): Promise<{ result: { transcription: Array<Record<string, string>> }, tokenUsage?: any, cost?: any } > => {
    if (MOCK_MODE) {
      return { result: { transcription: [{ Doctor: 'How are you?', Patient: 'Better today.' }] } };
    }
    try {
      const response = await axios.post(
        'https://dev-app.healthtune.io/api/transcription',
        payload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error classifying speakers:', error);
      throw new Error('Failed to classify speakers');
    }
  },

  updateSessionNote: async (sessionId: string, payload: UpdateNotePayload): Promise<boolean> => {
    if (MOCK_MODE) {
      return true;
    }
    try {
      await axios.put(`/session/${sessionId}/note`, payload);
      return true;
    } catch (error) {
      console.error('Error updating session note:', error);
      throw new Error('Failed to update session note');
    }
  },

  updateSessionDiagnosis: async (sessionId: string, diagnosis: Diagnosis): Promise<boolean> => {
    if (MOCK_MODE) {
      return true;
    }
    try {
      await axios.put(`/session/${sessionId}/diagnosis`, { content: { note: diagnosis } });
      return true;
    } catch (error) {
      console.error('Error updating session diagnosis:', error);
      throw new Error('Failed to update session diagnosis');
    }
  },

  updateSessionDetails: async (
    sessionId: string, 
    data: SessionDetailsUpdateData
  ): Promise<boolean> => {
    if (MOCK_MODE) {
      return true;
    }
    try {
      console.log('🚀 updateSessionDetails called with sessionId:', sessionId);
      console.log('📋 Data received:', data);
      
      const formData = new FormData();
      
      // Add summary if provided
      if (data.summary) {
        formData.append('summary[content]', data.summary);
        console.log('📝 Added summary:', data.summary);
      }
      
      // Add doctor notes if provided
      if (data.doctorNotes) {
        formData.append('doctorNotes[content]', data.doctorNotes);
        console.log('📋 Added doctor notes:', data.doctorNotes.substring(0, 100) + '...');
      }
      
      // Add diagnosis codes if provided
      if (data.diagnosisCodes) {
        formData.append('diagnosisCodes[content]', JSON.stringify(data.diagnosisCodes));
      }
      
      // Add noteFormat if provided
      if (data.noteFormat) {
        formData.append('noteFormat', data.noteFormat);
        console.log('📝 Added noteFormat:', data.noteFormat);
      }
      
      // Add transcript if provided
      if (data.transcript) {
        formData.append('transcript[assemblyId]', data.transcript.assemblyId);
        formData.append('transcript[content]', data.transcript.content);
        formData.append('transcript[duration]', data.transcript.duration.toString());
      }
      
      // Add cost information if provided
      if (data.cost) {
        formData.append('cost[totalInputTokens]', data.cost.totalInputTokens.toString());
        formData.append('cost[totalOutputTokens]', data.cost.totalOutputTokens.toString());
        formData.append('cost[totalTokens]', data.cost.totalTokens.toString());
        formData.append('cost[totalInputCost]', data.cost.totalInputCost.toString());
        formData.append('cost[totalOutputCost]', data.cost.totalOutputCost.toString());
        formData.append('cost[totalSessionCost]', data.cost.totalSessionCost.toString());
        
        // Add operations array
        data.cost.operations.forEach((operation, index) => {
          formData.append(`cost[operations][${index}]`, operation);
        });
      }
      
      // Add session audio if provided - use exact same approach as quick notes
      if (data.sessionAudio) {
        try {
          console.log('🎵 Adding session audio file to FormData in React Native format...');
          console.log('🎵 Audio URI:', data.sessionAudio);
          
          // Use exact same format as quick notes
          formData.append('sessionAudio', {
            uri: data.sessionAudio,
            type: 'audio/m4a',
            name: 'session-audio.m4a',
          } as any);
          
          console.log('🎵 Successfully added session audio to FormData');
        } catch (error) {
          console.error('❌ Failed to process session audio:', error);
          throw new Error(`Failed to process session audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      const fullUrl = `${axios.defaults.baseURL}/session/details/${sessionId}`;
      console.log('📡 Making PUT request to:', fullUrl);
      console.log('📦 FormData contents:', formData);
      console.log('🔗 Base URL:', axios.defaults.baseURL);
      
      const response = await axios.put(`/session/details/${sessionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ updateSessionDetails successful, response:', response.data);
      return true;
         } catch (error: any) {
       console.error('❌ Error updating session details:', error);
       
       // Log detailed error information
       if (error.response) {
         // Server responded with error status
         console.error('📡 Server Error Response:', {
           status: error.response.status,
           statusText: error.response.statusText,
           data: error.response.data,
           headers: error.response.headers
         });
         
         // Extract specific error message from server response
         const serverMessage = error.response.data?.message || 
                              error.response.data?.error || 
                              error.response.statusText;
         
         throw new Error(`Server error (${error.response.status}): ${serverMessage}`);
       } else if (error.request) {
         // Request was made but no response received
         console.error('🌐 Network Error - No response received:', error.request);
         throw new Error('Network error: No response from server');
       } else {
         // Something else happened
         console.error('⚠️ Request setup error:', error.message);
         throw new Error(`Request error: ${error.message}`);
       }
     }
  },

  approveSession: async (sessionId: string): Promise<boolean> => {
    if (MOCK_MODE) {
      return true;
    }
    try {
      console.log('✅ Approving session:', sessionId);
      await axios.put(`/session/${sessionId}`, { status: 'Approved' });
      console.log('✅ Session approved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error approving session:', error);
      throw new Error('Failed to approve session');
    }
  },
};

export default SessionsAPI; 