import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simple function to format a date for datetime-local input
 * Keeps the date as-is without timezone conversions
 * @param date The date to format
 * @returns A string in the format YYYY-MM-DDTHH:MM
 */
export function formatForDateTimeInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a date in a user-friendly way
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns true if the date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if a date is within the current week (from Sunday to Saturday)
 * @param date The date to check
 * @returns true if the date is within the current week
 */
export function isDateInCurrentWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday of this week
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); // Set to next Sunday
  
  return date >= startOfWeek && date < endOfWeek;
}

/**
 * Get the start date of current week (Sunday)
 * @returns Date object representing start of the current week
 */
export function getStartOfWeek(): Date {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday of this week
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}
