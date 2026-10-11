export interface Note {
  id: string | number;
  title?: string; // Optional since API doesn't return title
  description?: string;
  audioUrl?: string; // Keep for backward compatibility
  file: string; // New field from API response
  duration?: number; // in seconds, optional since API doesn't return it
  createdAt: string;
  updatedAt: string;
  transcript: string; // Human-readable transcript for display/search
  rawTranscript?: string; // Original transcript payload (may be JSON with speaker labels)
  userId?: number; // New field from API response
  speakers?: Speaker[];
  isProcessing?: boolean;
  thumbnailColor?: string;
}

export interface Speaker {
  id: string;
  name: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface TranscriptSegment {
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface NotePlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
} 