import { VALIDATION_PATTERNS } from './validation.constants';

export interface SanitizeTextOptions {
  trim?: boolean;
  collapseWhitespace?: boolean;
  allowLineBreaks?: boolean;
  stripHtml?: boolean;
  maxLength?: number;
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export function sanitizePlainText(value: unknown, options: SanitizeTextOptions = {}): string {
  const {
    trim = true,
    collapseWhitespace = true,
    allowLineBreaks = false,
    stripHtml = true,
    maxLength
  } = options;

  let sanitized = String(value ?? '');

  if (allowLineBreaks) {
    sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  } else {
    sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, '');
  }

  if (stripHtml) {
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/gi, '');
  }

  if (collapseWhitespace) {
    if (allowLineBreaks) {
      sanitized = sanitized
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
    } else {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }
  }

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (typeof maxLength === 'number' && maxLength >= 0) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeEmail(value: unknown): string {
  return sanitizePlainText(value, {
    trim: true,
    collapseWhitespace: true,
    stripHtml: true
  })
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function sanitizePassword(value: unknown): string {
  return String(value ?? '').trim();
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"'`=\/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function containsSuspiciousPattern(value: string): boolean {
  const normalized = String(value ?? '');
  return VALIDATION_PATTERNS.sqlInjection.test(normalized) || VALIDATION_PATTERNS.xss.test(normalized);
}

export function containsHtml(value: string): boolean {
  return /<[^>]+>/i.test(String(value ?? ''));
}

export function prepareTextForSubmission(
  value: unknown,
  options: Omit<SanitizeTextOptions, 'stripHtml'> = {}
): string {
  const sanitized = sanitizePlainText(value, {
    ...options,
    stripHtml: true
  });
  return escapeHtml(sanitized);
}
