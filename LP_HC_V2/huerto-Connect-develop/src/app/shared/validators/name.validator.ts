import { VALIDATION_LIMITS, VALIDATION_PATTERNS } from './validation.constants';
import { containsHtml, containsSuspiciousPattern, sanitizePlainText } from './security-sanitizer';
import { uniqueErrors } from './validation.utils';

export interface NameValidationOptions {
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
}

export function validateNameValue(value: unknown, options: NameValidationOptions = {}): string[] {
  const required = options.required ?? true;
  const label = options.label ?? 'Este campo';
  const minLength = options.minLength ?? VALIDATION_LIMITS.nameMinLength;
  const maxLength = options.maxLength ?? VALIDATION_LIMITS.nameMaxLength;
  const raw = String(value ?? '');
  const sanitized = sanitizePlainText(raw, {
    trim: true,
    collapseWhitespace: true,
    stripHtml: true,
    maxLength
  });
  const errors: string[] = [];

  if (!sanitized) {
    if (required) {
      errors.push(`${label} es obligatorio.`);
    }
    return errors;
  }

  if (containsHtml(raw) || containsSuspiciousPattern(raw)) {
    errors.push(`${label} contiene caracteres no permitidos.`);
  }

  if (sanitized.length < minLength || sanitized.length > maxLength) {
    errors.push(`${label} debe tener entre ${minLength} y ${maxLength} caracteres.`);
  }

  if (!VALIDATION_PATTERNS.name.test(sanitized)) {
    errors.push(`${label} solo acepta letras, acentos y espacios.`);
  }

  return uniqueErrors(errors);
}
