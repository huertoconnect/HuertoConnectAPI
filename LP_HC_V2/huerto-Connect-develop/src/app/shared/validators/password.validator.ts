import { VALIDATION_LIMITS } from './validation.constants';
import { containsSuspiciousPattern, sanitizePassword } from './security-sanitizer';
import { uniqueErrors } from './validation.utils';

export interface PasswordValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  requireStrongPattern?: boolean;
  label?: string;
}

export interface PasswordStrengthResult {
  level: 'weak' | 'medium' | 'strong';
  label: 'Débil' | 'Media' | 'Fuerte';
  percent: number;
}

export function validatePasswordValue(value: unknown, options: PasswordValidationOptions = {}): string[] {
  const required = options.required ?? true;
  const minLength = options.minLength ?? VALIDATION_LIMITS.passwordMinLength;
  const maxLength = options.maxLength ?? VALIDATION_LIMITS.passwordMaxLength;
  const requireStrongPattern = options.requireStrongPattern ?? true;
  const label = options.label ?? 'La contraseña';
  const password = sanitizePassword(value);
  const errors: string[] = [];

  if (!password) {
    if (required) {
      errors.push(`${label} es obligatoria.`);
    }
    return errors;
  }

  if (password.length < minLength) {
    errors.push(`${label} debe tener al menos ${minLength} caracteres.`);
  }

  if (password.length > maxLength) {
    errors.push(`${label} no puede exceder ${maxLength} caracteres.`);
  }

  if (/\s/.test(password)) {
    errors.push(`${label} no debe contener espacios.`);
  }

  if (requireStrongPattern) {
    if (!/[A-Z]/.test(password)) {
      errors.push(`${label} debe incluir al menos una mayúscula.`);
    }
    if (!/[a-z]/.test(password)) {
      errors.push(`${label} debe incluir al menos una minúscula.`);
    }
    if (!/\d/.test(password)) {
      errors.push(`${label} debe incluir al menos un número.`);
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push(`${label} debe incluir al menos un carácter especial (@$!%*?&).`);
    }
  }

  if (containsSuspiciousPattern(password)) {
    errors.push(`${label} contiene caracteres no permitidos.`);
  }

  return uniqueErrors(errors);
}

export function evaluatePasswordStrength(value: unknown): PasswordStrengthResult {
  const password = sanitizePassword(value);
  if (!password) {
    return { level: 'weak', label: 'Débil', percent: 0 };
  }

  let score = 0;
  if (password.length >= VALIDATION_LIMITS.passwordMinLength) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;

  if (score <= 2) {
    return { level: 'weak', label: 'Débil', percent: 33 };
  }
  if (score <= 4) {
    return { level: 'medium', label: 'Media', percent: 66 };
  }
  return { level: 'strong', label: 'Fuerte', percent: 100 };
}
