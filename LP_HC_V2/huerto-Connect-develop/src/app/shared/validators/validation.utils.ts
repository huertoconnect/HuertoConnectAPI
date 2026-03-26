export function uniqueErrors(errors: string[]): string[] {
  return [...new Set(errors.filter((error) => error.trim().length > 0))];
}

export function hasWhitespace(value: string): boolean {
  return /\s/.test(value);
}
