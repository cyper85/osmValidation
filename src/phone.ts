import { parsePhoneNumberFromString, type CountryCode, type PhoneNumber } from 'libphonenumber-js';
import { isEmergencyNumber } from './emergency.js';
import { fail, ok, type ValidationResult } from './result.js';

export type { CountryCode };

export interface PhoneOptions {
  /**
   * ISO 3166-1 alpha-2 code of the country the object is in, e.g. from
   * `addr:country`. Enables country-specific emergency numbers and
   * suggestions for numbers in national format.
   */
  country?: CountryCode;
}

const ALLOWED_CHARS = /^\+?[0-9 ()\-./]+$/;

/**
 * Validates a single phone number (`phone`, `contact:phone`, `fax`, …).
 * Use `validateEach` for values with several numbers separated by `;`.
 */
export function phone(value: string, options: PhoneOptions = {}): ValidationResult {
  const { country } = options;

  const trimmed = value.trim();
  if (trimmed !== value) {
    return fail('PHONE_WHITESPACE', 'Phone number has leading or trailing whitespace', suggest(trimmed, options));
  }
  if (/^tel:/i.test(value)) {
    return fail('PHONE_TEL_PREFIX', 'Phone number must not start with "tel:"', suggest(value.slice(4), options));
  }

  if (isEmergencyNumber(value, country)) {
    return ok('PHONE_EMERGENCY', 'Phone number is a valid emergency number');
  }

  if (value === '' || !ALLOWED_CHARS.test(value)) {
    return fail('PHONE_INVALID', 'Phone number contains invalid characters');
  }

  if (value.startsWith('+')) {
    const number = parse(value);
    if (number === undefined) {
      return fail('PHONE_INVALID', 'Phone number is not a valid international number');
    }
    if (/\(0\)/.test(value)) {
      return fail('PHONE_TRUNK_PREFIX', 'International phone number must not contain "(0)"', number.formatInternational());
    }
    return ok('PHONE_VALID', 'Phone number is a valid international number');
  }

  // "0049 …" instead of "+49 …"
  if (/^00[1-9]/.test(value)) {
    const number = parse(`+${value.slice(2)}`);
    if (number !== undefined) {
      return fail('PHONE_IDD_PREFIX', 'Use "+" instead of "00" before the country code', number.formatInternational());
    }
  }

  const number = country === undefined ? undefined : parse(value, country);
  return fail(
    'PHONE_NOT_INTERNATIONAL',
    'Phone number is not in international format (+<country code> <number>)',
    number?.formatInternational(),
  );
}

function parse(value: string, country?: CountryCode): PhoneNumber | undefined {
  const number = parsePhoneNumberFromString(value, country);
  return number?.isValid() ? number : undefined;
}

function suggest(candidate: string, options: PhoneOptions): string | undefined {
  const result = phone(candidate, options);
  return result.valid ? candidate : result.suggestion;
}
