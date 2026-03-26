import { validateEmailValue } from './email.validator';
import { validateNameValue } from './name.validator';
import { NumberValidationOptions, validateNumberValue } from './number.validator';
import { PasswordValidationOptions, validatePasswordValue } from './password.validator';
import {
  prepareTextForSubmission,
  sanitizeEmail,
  sanitizePassword,
  sanitizePlainText
} from './security-sanitizer';
import { TextValidationOptions, validateTextValue } from './text.validator';
import { uniqueErrors } from './validation.utils';

export type ValidationKind = 'text' | 'email' | 'password' | 'name' | 'number' | 'select' | 'checkbox';

export interface FieldValidationConfig {
  kind?: ValidationKind;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  maxDigits?: number;
  allowNegative?: boolean;
  allowLineBreaks?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
  label?: string;
}

export interface FieldValidationResult {
  sanitizedValue: unknown;
  errors: string[];
}

type PrimitiveFieldType = 'text' | 'email' | 'number' | 'select' | 'checkbox';

export function validateFieldValue(
  rawValue: unknown,
  config: FieldValidationConfig = {},
  fallbackType: PrimitiveFieldType = 'text'
): FieldValidationResult {
  const kind: ValidationKind = config.kind ?? inferKindFromFallback(fallbackType);
  const label = config.label ?? 'Este campo';
  const required = config.required ?? false;
  let sanitizedValue: unknown = rawValue;
  let errors: string[] = [];

  switch (kind) {
    case 'email':
      sanitizedValue = sanitizeEmail(rawValue);
      errors = validateEmailValue(rawValue, { required, label });
      break;
    case 'password':
      sanitizedValue = sanitizePassword(rawValue);
      errors = validatePasswordValue(rawValue, {
        required,
        label,
        minLength: config.minLength,
        maxLength: config.maxLength
      } satisfies PasswordValidationOptions);
      break;
    case 'name':
      sanitizedValue = sanitizePlainText(rawValue, {
        trim: true,
        collapseWhitespace: true,
        stripHtml: true,
        maxLength: config.maxLength
      });
      errors = validateNameValue(rawValue, {
        required,
        label,
        minLength: config.minLength,
        maxLength: config.maxLength
      });
      break;
    case 'number':
      sanitizedValue = normalizeNumberValue(rawValue);
      errors = validateNumberValue(rawValue, {
        required,
        label,
        min: config.min,
        max: config.max,
        integer: config.integer,
        maxDigits: config.maxDigits,
        allowNegative: config.allowNegative
      } satisfies NumberValidationOptions);
      break;
    case 'select': {
      const sanitized = sanitizePlainText(rawValue, {
        trim: true,
        collapseWhitespace: true,
        stripHtml: true,
        maxLength: config.maxLength
      });
      sanitizedValue = sanitized;
      if (required && !sanitized) {
        errors = [`${label} es obligatorio.`];
      }
      break;
    }
    case 'checkbox': {
      sanitizedValue = Boolean(rawValue);
      if (required && !sanitizedValue) {
        errors = [`${label} debe estar activado.`];
      }
      break;
    }
    case 'text':
    default:
      sanitizedValue = sanitizePlainText(rawValue, {
        trim: true,
        collapseWhitespace: true,
        stripHtml: true,
        allowLineBreaks: config.allowLineBreaks ?? false,
        maxLength: config.maxLength
      });
      errors = validateTextValue(rawValue, {
        required,
        label,
        minLength: config.minLength,
        maxLength: config.maxLength,
        allowLineBreaks: config.allowLineBreaks,
        pattern: config.pattern,
        patternMessage: config.patternMessage
      } satisfies TextValidationOptions);
      break;
  }

  return {
    sanitizedValue,
    errors: uniqueErrors(errors)
  };
}

export function sanitizeTextForBackend(value: unknown, maxLength?: number): string {
  return prepareTextForSubmission(value, {
    trim: true,
    collapseWhitespace: true,
    maxLength
  });
}

function inferKindFromFallback(type: PrimitiveFieldType): ValidationKind {
  if (type === 'email') return 'email';
  if (type === 'number') return 'number';
  if (type === 'select') return 'select';
  if (type === 'checkbox') return 'checkbox';
  return 'text';
}

function normalizeNumberValue(rawValue: unknown): number | string {
  const normalized = sanitizePlainText(rawValue, {
    trim: true,
    collapseWhitespace: true,
    stripHtml: true
  });

  if (!normalized) {
    return '';
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? normalized : parsed;
}
