import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStringOrTimestamp: any): string {
  if (!dateStringOrTimestamp) return '';
  try {
    if (typeof dateStringOrTimestamp === 'string') {
      return new Date(dateStringOrTimestamp).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    if (dateStringOrTimestamp.toDate) {
      return dateStringOrTimestamp.toDate().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return '';
  } catch {
    return '';
  }
}
