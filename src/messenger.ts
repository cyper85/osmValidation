import { formatInternational, phone, type PhoneOptions } from './phone.js';
import { checkPlatform, parseUrl, profileWithSubpage, type Platform } from './platform.js';
import { fail, type ValidationResult } from './result.js';

/**
 * Validates a phone number for a messenger. Codes are those of `phone`
 * with the messenger as prefix, e.g. "WHATSAPP_NOT_INTERNATIONAL".
 */
function messengerNumber(code: string, name: string, value: string, options: PhoneOptions): ValidationResult {
  const result = phone(value, options);
  if (result.code === 'PHONE_EMERGENCY') {
    return fail(`${code}_INVALID`, `An emergency number cannot be a ${name} number`);
  }
  return { ...result, code: result.code.replace(/^PHONE_/, `${code}_`) };
}

/** Validates a WhatsApp number (`contact:whatsapp`). Links to wa.me are converted. */
export function whatsapp(value: string, options: PhoneOptions = {}): ValidationResult {
  const parsed = parseUrl(value, /^(?:(?:www|api)\.)?(?:wa\.me|whatsapp\.com)$/i);
  if (parsed !== undefined) {
    const digits = parsed.hostname.endsWith('wa.me')
      ? parsed.pathname.slice(1).replace(/\/$/, '')
      : parsed.searchParams.get('phone') ?? '';
    const suggestion = /^\d+$/.test(digits) ? formatInternational(`+${digits}`) : undefined;
    return fail('WHATSAPP_URL', 'Use the phone number instead of a WhatsApp link', suggestion);
  }
  return messengerNumber('WHATSAPP', 'WhatsApp', value, options);
}

const TELEGRAM_USERNAME = /^@?[a-z][a-z0-9_]{4,31}$/i;

const TELEGRAM: Platform = {
  code: 'TELEGRAM',
  name: 'Telegram',
  host: /^(?:www\.)?(?:t\.me|telegram\.me|telegram\.dog)$/i,
  base: 'https://t.me/',
  isUsername: (value) => TELEGRAM_USERNAME.test(value),
  usernamePath: (username) => username,
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    if (first.startsWith('+') || (first === 'joinchat' && second !== '')) {
      // invite link
      return profileWithSubpage(segments, first === 'joinchat' ? 2 : 1);
    }
    if (first === 's' && TELEGRAM_USERNAME.test(second) && segments.length === 2) {
      // web preview of a channel
      return { path: second, trimmed: true };
    }
    return TELEGRAM_USERNAME.test(first) && !first.startsWith('@') ? profileWithSubpage(segments, 1) : undefined;
  },
};

/**
 * Validates a Telegram contact (`contact:telegram`): a username, a link to
 * t.me or a phone number. Usernames are valid, with the link as suggestion.
 */
export function telegram(value: string, options: PhoneOptions = {}): ValidationResult {
  if (/^[+0-9(]/.test(value)) {
    return messengerNumber('TELEGRAM', 'Telegram', value, options);
  }
  return checkPlatform(value, TELEGRAM);
}
