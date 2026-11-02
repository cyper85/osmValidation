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
      return fail('PHONE_TRUNK_PREFIX', 'International phone number must not contain "(0)"', international(number, value));
    }
    return ok('PHONE_VALID', 'Phone number is a valid international number');
  }

  // "0049 …" instead of "+49 …"
  if (/^00[1-9]/.test(value)) {
    const number = parse(`+${value.slice(2)}`);
    if (number !== undefined) {
      return fail('PHONE_IDD_PREFIX', 'Use "+" instead of "00" before the country code', international(number, value));
    }
  }

  const number = country === undefined ? undefined : parse(value, country);
  // "4930123456" instead of "+49 30 123456"
  const withPlus = number === undefined && /^[1-9]\d{9,14}$/.test(value) ? parse(`+${value}`) : undefined;
  if (withPlus !== undefined) {
    return fail('PHONE_PLUS_MISSING', 'Phone number is missing the "+" before the country code', international(withPlus, value));
  }
  return fail(
    'PHONE_NOT_INTERNATIONAL',
    'Phone number is not in international format (+<country code> <number>)',
    number === undefined ? undefined : international(number, value),
  );
}

/** International format of a valid phone number, e.g. "+49 30 1234567". */
export function formatInternational(value: string, country?: CountryCode): string | undefined {
  return parse(value, country)?.formatInternational();
}

/**
 * The extension of a number written as in DIN 5008, e.g. "0" in
 * "03677 6414-0" or "+49 3677 6414-0": the digits after the only hyphen, if
 * another separator comes before it. In "0361-12345" the hyphen separates
 * the area code, which is no extension.
 */
function extensionOf(value: string): string | undefined {
  const match = /^(.*\d)\s*-\s*(\d{1,5})$/.exec(value.trim());
  if (match === null) {
    return undefined;
  }
  const [, before = '', extension] = match;
  // other hyphens are group separators (e.g. "8 922 703-30-00" in Russia), no extension
  return !before.includes('-') && /\d[\s/.]+\d|\)/.test(before) ? extension : undefined;
}

/**
 * International format of the number, keeping the extension separated by a
 * hyphen as in the original value (allowed in OpenStreetMap, see
 * https://wiki.openstreetmap.org/wiki/Key:phone): "03677 6414-0" becomes
 * "+49 3677 6414-0", not "+49 3677 64140".
 */
function international(number: PhoneNumber, original: string): string {
  const formatted = number.formatInternational();
  const extension = extensionOf(original);
  if (extension === undefined) {
    return formatted;
  }
  // from the end, the position before the last digits that make up the extension
  let start = formatted.length;
  for (let digits = 0; start > 0 && digits < extension.length; ) {
    start -= 1;
    if (/\d/.test(formatted[start] ?? '')) {
      digits += 1;
    }
  }
  const tail = formatted.slice(start).replace(/\D/g, '');
  return tail === extension ? `${formatted.slice(0, start).trimEnd()}-${tail}` : formatted;
}

function parse(value: string, country?: CountryCode): PhoneNumber | undefined {
  const number = parsePhoneNumberFromString(value, country);
  return number?.isValid() ? number : undefined;
}

function suggest(candidate: string, options: PhoneOptions): string | undefined {
  const result = phone(candidate, options);
  return result.valid ? candidate : result.suggestion;
}
