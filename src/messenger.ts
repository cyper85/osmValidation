import { formatInternational, phone, type PhoneOptions } from './phone.js';
import { checkPlatform, parseUrl, pathSegments, profileWithSubpage, sameUrl, type Platform } from './platform.js';
import { fail, ok, type ValidationResult } from './result.js';

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

/**
 * WhatsApp usernames (wa.me/<username>): letters, digits, periods and
 * underscores, at least one letter, so they cannot be taken for a number.
 */
const WHATSAPP_USERNAME = /^(?=.*[a-z])[a-z0-9._]{3,35}$/i;
const WHATSAPP_HOST = /^(?:(?:www|api)\.)?(?:wa\.me|whatsapp\.com)$/i;

/** The canonical link for a username or a business short link. */
function whatsappLink(path: string, value: string): ValidationResult {
  const canonical = `https://wa.me/${path}`;
  return ok('WHATSAPP_URL', 'Valid WhatsApp link', sameUrl(value, canonical) ? undefined : canonical);
}

/**
 * Validates `contact:whatsapp`: a phone number, a username with "@", or a
 * link to wa.me with a number, a username or a business short link
 * (wa.me/message/…). Links with a number are valid, but the number alone is
 * preferred (suggestion). Usernames get the link as suggestion.
 */
export function whatsapp(value: string, options: PhoneOptions = {}): ValidationResult {
  if (value.startsWith('@') && WHATSAPP_USERNAME.test(value.slice(1))) {
    return ok('WHATSAPP_USERNAME', 'Valid WhatsApp username', `https://wa.me/${value.slice(1)}`);
  }
  const parsed = parseUrl(value, WHATSAPP_HOST);
  if (parsed === undefined) {
    return messengerNumber('WHATSAPP', 'WhatsApp', value, options);
  }
  const segments = pathSegments(parsed);
  const onWaMe = parsed.hostname.toLowerCase().endsWith('wa.me');
  const digits = onWaMe ? (segments.length === 1 ? segments[0]! : '') : segments.join('/') === 'send' ? (parsed.searchParams.get('phone') ?? '') : '';
  if (/^\+?\d{6,}$/.test(digits)) {
    const number = formatInternational(`+${digits.replace(/^\+/, '')}`);
    const extra = [...parsed.searchParams.keys()].some((key) => key !== 'phone') || parsed.hash !== '';
    if (number === undefined) {
      return fail('WHATSAPP_INVALID', 'The WhatsApp link contains no valid phone number');
    }
    return extra
      ? fail('WHATSAPP_URL_PARAMETERS', 'WhatsApp link contains parameters (e.g. a prefilled message)', number)
      : ok('WHATSAPP_URL_NUMBER', 'Valid WhatsApp link; the phone number alone is preferred', number);
  }
  const path = onWaMe
    ? segments.length === 2 && segments[0]!.toLowerCase() === 'message' && /^[a-z0-9]+$/i.test(segments[1]!)
      ? `message/${segments[1]}`
      : segments.length === 1 && segments[0]!.toLowerCase() !== 'message' && WHATSAPP_USERNAME.test(segments[0]!)
        ? segments[0]!
        : undefined
    : undefined;
  if (path === undefined) {
    return fail('WHATSAPP_INVALID', 'URL does not point to a WhatsApp contact');
  }
  if ([...parsed.searchParams.keys()].length > 0 || parsed.hash !== '') {
    return fail('WHATSAPP_URL_PARAMETERS', 'WhatsApp link contains parameters (e.g. a prefilled message)', `https://wa.me/${path}`);
  }
  return whatsappLink(path, value);
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
