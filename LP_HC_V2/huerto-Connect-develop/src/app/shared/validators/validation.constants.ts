export const VALIDATION_LIMITS = {
  emailMaxLength: 254,
  passwordMinLength: 8,
  passwordMaxLength: 64,
  nameMinLength: 2,
  nameMaxLength: 50,
  longTextMinLength: 5,
  longTextMaxLength: 500,
  defaultTextMinLength: 2,
  defaultTextMaxLength: 120
} as const;

export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,64}$/,
  name: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/,
  integer: /^-?\d+$/,
  decimal: /^-?\d+(\.\d+)?$/,
  sqlInjection:
    /(\b(select|insert|update|delete|drop|truncate|union|alter|create|exec|execute)\b|--|\/\*|\*\/|;|@@|xp_)/i,
  xss: /<\s*script|<\/\s*script|javascript:|on\w+\s*=/i,
  htmlTag: /<[^>]+>/gi
} as const;
