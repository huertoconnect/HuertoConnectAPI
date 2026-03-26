import { VALIDATION_LIMITS } from './validation.constants';
import { containsHtml, containsSuspiciousPattern, sanitizePlainText } from './security-sanitizer';
import { uniqueErrors } from './validation.utils';

export interface TextValidationOptions {
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  allowLineBreaks?: boolean;
  allowHtml?: boolean;
  blockSuspiciousPatterns?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
}

export function validateTextValue(value: unknown, options: TextValidationOptions = {}): string[] {
  const required = options.required ?? true;
  const label = options.label ?? 'Este campo';
  const minLength = options.minLength ?? VALIDATION_LIMITS.defaultTextMinLength;
  const maxLength = options.maxLength ?? VALIDATION_LIMITS.defaultTextMaxLength;
  const allowLineBreaks = options.allowLineBreaks ?? false;
  const allowHtml = options.allowHtml ?? false;
  const blockSuspiciousPatterns = options.blockSuspiciousPatterns ?? true;

  const raw = String(value ?? '');
  const sanitized = sanitizePlainText(raw, {
    trim: true,
    collapseWhitespace: true,
    allowLineBreaks,
    stripHtml: allowHtml ? false : true,
    maxLength
  });

  const errors: string[] = [];

  if (!sanitized) {
    if (required) {
      errors.push(`${label} es obligatorio.`);
    }
    return errors;
  }

  if (!allowHtml && containsHtml(raw)) {
    errors.push(`${label} no permite HTML.`);
  }

  if (blockSuspiciousPatterns && containsSuspiciousPattern(raw)) {
    errors.push(`${label} contiene secuencias no permitidas.`);
  }

  if (sanitized.length < minLength) {
    errors.push(`${label} debe tener al menos ${minLength} caracteres.`);
  }

  if (sanitized.length > maxLength) {
    errors.push(`${label} no puede exceder ${maxLength} caracteres.`);
  }

  if (options.pattern && !options.pattern.test(sanitized)) {
    errors.push(options.patternMessage ?? `${label} contiene caracteres inválidos.`);
  }

  return uniqueErrors(errors);
}

export function validateLongTextValue(value: unknown, label = 'Este campo'): string[] {
  return validateTextValue(value, {
    required: true,
    label,
    minLength: VALIDATION_LIMITS.longTextMinLength,
    maxLength: VALIDATION_LIMITS.longTextMaxLength,
    allowLineBreaks: true
  });
}
