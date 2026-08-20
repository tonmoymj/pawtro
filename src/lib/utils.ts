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

export function normalizeBanglaPhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+88')) return digits.slice(1);
  if (digits.startsWith('88')) return digits;
  if (digits.startsWith('0')) return '88' + digits;
  return digits;
}

export function getWhatsAppUrl(rawPhone?: string, message = ''): string | null {
  if (!rawPhone) return null;
  const clean = normalizeBanglaPhone(rawPhone);
  if (!clean || clean.length < 10) return null;
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${textParam}`;
}

/**
 * Normalizes Bangla Unicode characters (e.g. ড়/ড়, ঢ়/ঢ়, য়/য়, ZWJ/ZWNJ)
 * to ensure robust search matching.
 */
export function normalizeBanglaText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Remove Zero Width Joiner and Non-Joiner
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize decomposed nukta combinations
    .replace(/\u09A1\u09BC/g, '\u09DC') // ড + nukta -> ড়
    .replace(/\u09A2\u09BC/g, '\u09DD') // ঢ + nukta -> ঢ়
    .replace(/\u09AF\u09BC/g, '\u09DF') // য + nukta -> য়
    .trim();
}
