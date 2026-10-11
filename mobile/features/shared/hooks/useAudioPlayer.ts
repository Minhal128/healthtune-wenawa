import { NotePlayerState } from '@/features/quick-notes/types/note';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';

export interface AudioPlayerHook extends NotePlayerState {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setRate: (rate: number) => void;
  replace: (audioUrl: string) => void;
  currentRate: number;
}

export const useNoteAudioPlayer = (initialAudioUrl?: string): AudioPlayerHook => {
  const player = useAudioPlayer(initialAudioUrl);
  const status = useAudioPlayerStatus(player);
  
  const [currentRate, setCurrentRate] = useState(1);
  const [state, setState] = useState<NotePlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
  });

  // Update state based on player status
  useEffect(() => {
    if (status) {
      setState(prev => ({
        ...prev,
        isPlaying: status.playing,
        currentTime: status.currentTime || 0,
        duration: status.duration || 0,
        isLoading: status.isBuffering,
        error: null,
      }));
    }
  }, [status]);

  const play = () => {
    try {
      player.play();
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to play audio' }));
    }
  };

  const pause = () => {
    try {
      player.pause();
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to pause audio' }));
    }
  };

  const seekTo = async (seconds: number) => {
    try {
      await player.seekTo(seconds);
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to seek audio' }));
    }
  };

  const setRate = (rate: number) => {
    try {
      player.setPlaybackRate(rate);
      setCurrentRate(rate);
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to set playback rate' }));
    }
  };

  const replace = (audioUrl: string) => {
    try {
      player.replace(audioUrl);
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to load audio' }));
    }
  };

  return {
    ...state,
    play,
    pause,
    seekTo,
    setRate,
    replace,
    currentRate,
  };
}; 