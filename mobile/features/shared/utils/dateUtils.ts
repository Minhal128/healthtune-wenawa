/**
 * Date utility functions for proper timezone handling
 * Converts UTC dates from backend to user's local timezone
 */

/**
 * Parses a date string from the backend
 * The backend stores local time but marks it as UTC (with 'Z' suffix)
 * This function parses it as local time to display correctly
 * @param dateString - Date string from backend (e.g., "2025-08-13T00:56:07.161Z")
 * @returns Date object in local timezone
 */
export const parseUTCDate = (dateString: string | null | undefined): Date => {
  if (!dateString || typeof dateString !== 'string') {
    return new Date();
  }
  
  // Remove the 'Z' suffix and any timezone indicators to parse as local time
  // This prevents JavaScript from converting from UTC to local time
  const dateWithoutTimezone = dateString.replace(/Z|([+-]\d{2}:\d{2})$/, '');
  return new Date(dateWithoutTimezone);
};

/**
 * Formats duration in seconds to MM:SS or HH:MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats a date string for relative display (e.g., "Today", "Yesterday", "2 days ago")
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  const date = parseUTCDate(dateString);
  const now = new Date();
  
  // Check if it's today
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) return 'Yesterday';
  
  // Calculate days difference for older dates
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Formats a date string as a title with time (e.g., "Today at 2:30 PM")
 */
export const formatDateAsTitle = (dateString: string): string => {
  const date = parseUTCDate(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
  
  if (isToday) {
    return `Today at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a date string for full date display
 */
export const formatFullDate = (dateString: string): string => {
  const date = parseUTCDate(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats time from a date string
 */
export const formatTimeFromDate = (dateString: string): string => {
  const date = parseUTCDate(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats time in seconds to MM:SS or HH:MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
