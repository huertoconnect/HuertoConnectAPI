import { VALIDATION_LIMITS, VALIDATION_PATTERNS } from './validation.constants';
import { containsHtml, containsSuspiciousPattern, sanitizeEmail } from './security-sanitizer';
import { hasWhitespace, uniqueErrors } from './validation.utils';

export interface EmailValidationOptions {
  required?: boolean;
  label?: string;
}

export function validateEmailValue(value: unknown, options: EmailValidationOptions = {}): string[] {
  const required = options.required ?? true;
  const label = options.label ?? 'El correo electrónico';
  const raw = String(value ?? '');
  const sanitized = sanitizeEmail(raw);
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

  if (hasWhitespace(raw)) {
    errors.push(`${label} no debe contener espacios.`);
  }

  if (sanitized.length > VALIDATION_LIMITS.emailMaxLength) {
    errors.push(`${label} no puede exceder ${VALIDATION_LIMITS.emailMaxLength} caracteres.`);
  }

  if (!sanitized.includes('@')) {
    errors.push(`${label} debe contener "@".`);
  }

  const domain = sanitized.split('@')[1] ?? '';
  if (!domain || domain.startsWith('.') || !domain.includes('.')) {
    errors.push(`${label} debe contener un dominio válido.`);
  }

  if (!VALIDATION_PATTERNS.email.test(sanitized)) {
    errors.push(`${label} no tiene un formato válido.`);
  }

  return uniqueErrors(errors);
}
