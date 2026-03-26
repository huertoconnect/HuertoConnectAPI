import { VALIDATION_PATTERNS } from './validation.constants';
import { containsHtml, containsSuspiciousPattern, sanitizePlainText } from './security-sanitizer';
import { uniqueErrors } from './validation.utils';

export interface NumberValidationOptions {
  required?: boolean;
  label?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  maxDigits?: number;
  allowNegative?: boolean;
}

export function validateNumberValue(value: unknown, options: NumberValidationOptions = {}): string[] {
  const required = options.required ?? true;
  const label = options.label ?? 'Este campo';
  const integer = options.integer ?? false;
  const allowNegative = options.allowNegative ?? false;
  const raw = String(value ?? '');
  const sanitized = sanitizePlainText(raw, {
    trim: true,
    collapseWhitespace: true,
    stripHtml: true
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

  const numericPattern = integer ? VALIDATION_PATTERNS.integer : VALIDATION_PATTERNS.decimal;
  if (!numericPattern.test(sanitized)) {
    errors.push(`${label} debe contener solo números válidos.`);
    return uniqueErrors(errors);
  }

  const parsed = Number(sanitized);
  if (Number.isNaN(parsed)) {
    errors.push(`${label} debe ser un número válido.`);
    return uniqueErrors(errors);
  }

  if (!allowNegative && parsed < 0) {
    errors.push(`${label} no puede ser negativo.`);
  }

  if (integer && !Number.isInteger(parsed)) {
    errors.push(`${label} debe ser un número entero.`);
  }

  if (typeof options.min === 'number' && parsed < options.min) {
    errors.push(`${label} debe ser mayor o igual a ${options.min}.`);
  }

  if (typeof options.max === 'number' && parsed > options.max) {
    errors.push(`${label} debe ser menor o igual a ${options.max}.`);
  }

  if (typeof options.maxDigits === 'number') {
    const digitsCount = sanitized.replace(/[-.]/g, '').length;
    if (digitsCount > options.maxDigits) {
      errors.push(`${label} no puede exceder ${options.maxDigits} dígitos.`);
    }
  }

  return uniqueErrors(errors);
}
