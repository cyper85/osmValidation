import type { ValidationResult } from './result.js';

export interface PartResult {
  value: string;
  result: ValidationResult;
}

export interface MultiValidationResult {
  /** True if every part is valid and there are no empty parts. */
  valid: boolean;
  results: PartResult[];
  /** Corrected value for the whole tag, if every problem can be fixed. */
  suggestion?: string;
}

/** Splits an OSM multi-value (`a;b;c`) into its trimmed parts. */
export function splitValues(value: string): string[] {
  return value.split(';').map((part) => part.trim());
}

/**
 * Validates each part of an OSM multi-value separately.
 *
 * @example validateEach('+49 30 1234567;112', (v) => phone(v, { country: 'DE' }))
 */
export function validateEach(
  value: string,
  validator: (part: string) => ValidationResult,
): MultiValidationResult {
  const parts = splitValues(value);
  const hasEmpty = parts.some((part) => part === '');
  const results = parts
    .filter((part) => part !== '')
    .map((part) => ({ value: part, result: validator(part) }));

  const valid = !hasEmpty && results.every(({ result }) => result.valid);
  const fixable = results.every(({ result }) => result.valid || result.suggestion !== undefined);
  const changed = hasEmpty || results.some(({ result }) => result.suggestion !== undefined);

  const multi: MultiValidationResult = { valid, results };
  if (fixable && changed && results.length > 0) {
    multi.suggestion = results.map(({ value, result }) => result.suggestion ?? value).join(';');
  }
  return multi;
}
