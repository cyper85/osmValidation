import { bluesky, diaspora, gnusocial, mastodon, matrix, mobilizon } from './fediverse.js';
import { mail } from './mail.js';
import { telegram, whatsapp } from './messenger.js';
import { validateEach, type MultiValidationResult } from './multi.js';
import { phone, type PhoneOptions } from './phone.js';
import type { ValidationResult } from './result.js';
import {
  facebook,
  flickr,
  instagram,
  linkedin,
  pinterest,
  tiktok,
  tripadvisor,
  twitter,
  vimeo,
  vk,
  xing,
  youtube,
} from './social.js';
import { url } from './url.js';
import { wikidata, wikipedia } from './wiki.js';

export type Validator = (value: string, options?: PhoneOptions) => ValidationResult;

/** Validators for `contact:<name>`. */
const CONTACT: Record<string, Validator> = {
  phone,
  mobile: phone,
  fax: phone,
  sms: phone,
  tty: phone,
  email: mail,
  website: url,
  webcam: url,
  facebook,
  twitter,
  x: twitter,
  instagram,
  tiktok,
  youtube,
  linkedin,
  xing,
  pinterest,
  vimeo,
  flickr,
  vk,
  tripadvisor,
  whatsapp,
  telegram,
  mastodon,
  mobilizon,
  diaspora,
  gnusocial,
  bluesky,
  matrix,
};

/** Validators for keys without prefix. */
const PLAIN: Record<string, Validator> = {
  phone,
  fax: phone,
  email: mail,
  website: url,
  url,
};

/**
 * Returns the validator for an OSM key, e.g. `contact:instagram`, `phone`
 * or `brand:wikidata`, or `undefined` if the key is not supported.
 */
export function validatorFor(key: string): Validator | undefined {
  if (key.startsWith('contact:')) {
    const name = key.slice('contact:'.length);
    return Object.hasOwn(CONTACT, name) ? CONTACT[name] : undefined;
  }
  if (Object.hasOwn(PLAIN, key)) {
    return PLAIN[key];
  }
  const suffix = key.slice(key.lastIndexOf(':') + 1);
  return suffix === 'wikipedia' ? wikipedia : suffix === 'wikidata' ? wikidata : undefined;
}

/**
 * Validates an OSM tag, including values with several parts separated by
 * `;`. Returns `undefined` if the key is not supported.
 *
 * @example validateTag('contact:phone', '030 1234567', { country: 'DE' })
 */
export function validateTag(key: string, value: string, options: PhoneOptions = {}): MultiValidationResult | undefined {
  const validator = validatorFor(key);
  return validator === undefined ? undefined : validateEach(value, (part) => validator(part, options));
}
