/**
 * Core security and formatting utilities for Glazing frontend.
 */

/**
 * Escapes untrusted text to safely prevent DOM-based Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats minutes into human-readable duration (e.g. "1h 45m" or "45m").
 */
export function formatMinutes(mins: number): string {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Sanitizes URLs to prevent javascript: or data: URI-based XSS exploits in href attributes.
 */
export function safeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  const clean = String(url).trim();
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  return '#';
}

