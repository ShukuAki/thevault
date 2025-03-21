import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a duration in seconds to a readable time string (MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  // Format as MM/DD/YYYY
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}
