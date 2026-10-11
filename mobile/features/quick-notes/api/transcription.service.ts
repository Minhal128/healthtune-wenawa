import { ASSEMBLY_AI_API_KEY, MOCK_MODE } from '@/utils/constants';

export interface TranscriptionResult {
  transcript: string;
  sentences: any[];
  id: string; // AssemblyAI transcript ID
}

export interface TranscriptionStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
}

export interface TranscriptionProgress {
  step: 'uploading' | 'transcribing' | 'polling' | 'sentences' | 'complete';
  message: string;
}

export type ProgressCallback = (progress: TranscriptionProgress) => void;

export const TranscriptionService = {
  uploadAudio: async (audioUri: string, onProgress?: ProgressCallback): Promise<string> => {
    try {
      console.log('🔄 TranscriptionService.uploadAudio called with URI:', audioUri);
      onProgress?.({ step: 'uploading', message: 'Preparing audio file...' });
      
      // Read the audio file and convert to blob
      console.log('📂 Reading audio file from URI...');
      let audioBlob: Blob;
      
      // Check if it's a local file URI (iOS) or web URI
      if (audioUri.startsWith('file://') || audioUri.startsWith('/')) {
        // For iOS local files, we need to use a different approach
        console.log('📂 Detected local file URI, using React Native file handling...');
        
        try {
          // Try the standard fetch first (works on some React Native versions)
          const response = await fetch(audioUri);
          if (response.ok) {
            audioBlob = await response.blob();
            console.log('📂 Successfully read local file with fetch');
          } else {
            throw new Error(`Failed to read local file: ${response.status}`);
          }
        } catch (fetchError) {
          console.log('📂 Standard fetch failed, trying XMLHttpRequest approach...');
          
          // Alternative approach using XMLHttpRequest for local files
          const xhr = new XMLHttpRequest();
          xhr.open('GET', audioUri, true);
          xhr.responseType = 'blob';
          
          const blobPromise = new Promise<Blob>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status === 200) {
                resolve(xhr.response);
              } else {
                reject(new Error(`XHR failed with status: ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('XHR failed'));
            xhr.send();
          });
          
          audioBlob = await blobPromise;
          console.log('📂 Successfully read local file with XMLHttpRequest');
        }
      } else {
        // For web URIs, use the standard fetch approach
        console.log('📂 Detected web URI, using standard fetch...');
        const response = await fetch(audioUri);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
        }
        
        audioBlob = await response.blob();
      }
      
      console.log('📂 Audio blob size:', audioBlob.size, 'bytes');
      console.log('📂 Audio blob type:', audioBlob.type);
      
      if (audioBlob.size === 0) {
        throw new Error('Audio file is empty');
      }
      
      console.log('⬆️ Uploading blob to AssemblyAI...');
      const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          authorization: ASSEMBLY_AI_API_KEY,
          "Content-Type": "audio/m4a",
        },
        body: audioBlob,
      });

      console.log('⬆️ Upload response status:', uploadResponse.status);
      const uploadData = await uploadResponse.json();
      console.log("⬆️ Upload Response:", uploadData);

      if (uploadData.error) {
        throw new Error(uploadData.error || 'Failed to upload audio');
      }

      if (!uploadData.upload_url) {
        throw new Error('No upload URL returned from AssemblyAI');
      }

      console.log('✅ Upload successful, URL:', uploadData.upload_url);
      return uploadData.upload_url;
    } catch (error) {
      console.error('❌ Audio upload error:', error);
      throw new Error(`Failed to upload audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  requestTranscription: async (audioUrl: string, languageCode: string = 'en', onProgress?: ProgressCallback): Promise<string> => {
    try {
      console.log('🎯 TranscriptionService.requestTranscription called');
      console.log('🎯 Audio URL:', audioUrl);
      console.log('🎯 Language:', languageCode);
      
      onProgress?.({ step: 'transcribing', message: 'Starting transcription...' });
      
      const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          authorization: ASSEMBLY_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: languageCode,
          speech_model: "universal",
          speaker_labels: true,
          speakers_expected: 2
        }),
      });

      console.log('🎯 Transcript request status:', transcriptResponse.status);
      const transcriptData = await transcriptResponse.json();
      console.log("🎯 Transcript Response:", transcriptData);

      if (transcriptData.error) {
        throw new Error(transcriptData.error || 'Failed to request transcription');
      }

      if (!transcriptData.id) {
        throw new Error('No transcript ID returned from AssemblyAI');
      }

      console.log('✅ Transcription requested successfully, ID:', transcriptData.id);
      return transcriptData.id;
    } catch (error) {
      console.error('❌ Transcription request error:', error);
      throw new Error(`Failed to request transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  checkTranscriptionStatus: async (transcriptId: string): Promise<TranscriptionStatus> => {
    try {
      console.log('🔍 Checking status for transcript ID:', transcriptId);
      
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        method: "GET",
        headers: {
          authorization: ASSEMBLY_AI_API_KEY,
        },
      });

      console.log('🔍 Status check response:', response.status);
      const data = await response.json();
      console.log("🔍 Transcription Status:", data.status, data.error ? `(Error: ${data.error})` : '');

      return {
        id: data.id,
        status: data.status,
        text: data.text,
        error: data.error
      };
    } catch (error) {
      console.error('❌ Status check error:', error);
      throw new Error(`Failed to check transcription status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  pollTranscriptionResult: async (transcriptId: string, onProgress?: ProgressCallback, maxRetries: number = 60): Promise<string> => {
    let retries = 0;
    
    console.log('⏳ Starting to poll for transcription result...');
    onProgress?.({ step: 'polling', message: 'Processing transcription...' });
    
    while (retries < maxRetries) {
      const status = await TranscriptionService.checkTranscriptionStatus(transcriptId);
      
      if (status.status === 'completed') {
        console.log('✅ Transcription completed!');
        return status.text || '';
      } else if (status.status === 'error') {
        throw new Error(status.error || 'Transcription failed');
      }
      
      // Update progress message based on status
      if (status.status === 'processing') {
        onProgress?.({ step: 'polling', message: 'Transcribing audio...' });
      } else if (status.status === 'queued') {
        onProgress?.({ step: 'polling', message: 'Waiting in queue...' });
      }
      
      console.log(`⏳ Retry ${retries + 1}/${maxRetries}, status: ${status.status}`);
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }
    
    throw new Error('Transcription timed out after 2 minutes');
  },

  getSentences: async (transcriptId: string, onProgress?: ProgressCallback): Promise<any[]> => {
    try {
      console.log('📝 Fetching sentences for transcript ID:', transcriptId);
      onProgress?.({ step: 'sentences', message: 'Fetching detailed transcript...' });
      
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}/sentences`, {
        method: "GET",
        headers: {
          authorization: ASSEMBLY_AI_API_KEY,
        },
      });

      console.log('📝 Sentences response status:', response.status);
      const data = await response.json();
      console.log('📝 Sentences count:', data.sentences?.length || 0);
      
      return data.sentences || [];
    } catch (error) {
      console.error('❌ Get sentences error:', error);
      return [];
    }
  },

  transcribeAudio: async (audioUri: string, languageCode?: string, onProgress?: ProgressCallback): Promise<TranscriptionResult> => {
    if (MOCK_MODE) {
      onProgress?.({ step: 'complete', message: 'Mock transcription complete' });
      return {
        transcript: 'Doctor: How are you feeling today?\nPatient: Better than last week.',
        sentences: [
          { speaker: 'A', text: 'How are you feeling today?', start: 0, end: 2000 },
          { speaker: 'B', text: 'Better than last week.', start: 2000, end: 4000 },
        ],
        id: 'mock-transcript-id',
      };
    }
    try {
      console.log('🚀 Starting complete transcription process for audio:', audioUri);
      console.log('🚀 Language code:', languageCode || 'en');
      console.log('🚀 AssemblyAI API Key:', ASSEMBLY_AI_API_KEY ? 'Present' : 'Missing');
      
      // Step 1: Upload audio
      console.log('📤 Step 1: Upload audio');
      const audioUrl = await TranscriptionService.uploadAudio(audioUri, onProgress);
      
      // Step 2: Request transcription
      console.log('🎯 Step 2: Request transcription');
      // If requested language is Urdu, use Hindi for AssemblyAI to improve recognition
      const assemblyLanguageCode = (languageCode === 'ur') ? 'hi' : (languageCode || 'en');
      const transcriptId = await TranscriptionService.requestTranscription(
        audioUrl,
        assemblyLanguageCode,
        onProgress
      );
      
      // Step 3: Poll for results
      console.log('⏳ Step 3: Poll for results');
      const transcript = await TranscriptionService.pollTranscriptionResult(transcriptId, onProgress);
      
      // Step 4: Get sentences for detailed breakdown
      console.log('📝 Step 4: Get sentences');
      const sentences = await TranscriptionService.getSentences(transcriptId, onProgress);
      
      onProgress?.({ step: 'complete', message: 'Transcription complete!' });
      
      console.log('✅ Complete transcription finished successfully');
      console.log('✅ Transcript length:', transcript.length);
      console.log('✅ Sentences count:', sentences.length);
      
      return {
        transcript,
        sentences,
        id: transcriptId
      };
    } catch (error) {
      console.error('❌ Complete transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  createTranscription: (sentences: any[]) => {
    // Transform sentences into speaker-labeled format expected by BE routes
    // { transcription: [ {A: "..."}, {B: "..."}, ... ] }
    const items = (sentences || []).map((sentence: any) => {
      const speaker: string = sentence?.speaker || 'R';
      const text: string = sentence?.text || '';
      return { [speaker]: text } as Record<string, string>;
    });
    return { transcription: items };
  }
};

export default TranscriptionService; 