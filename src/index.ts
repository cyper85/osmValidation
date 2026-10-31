export type { ValidationResult } from './result.js';
export { splitValues, validateEach, type MultiValidationResult, type PartResult } from './multi.js';
export { validateTag, validatorFor, type Validator } from './keys.js';
export { url, url as webcam } from './url.js';
export { mail } from './mail.js';
export { phone, formatInternational, type PhoneOptions, type CountryCode } from './phone.js';
export { EMERGENCY_NUMBERS, isEmergencyNumber } from './emergency.js';
export {
  facebook,
  facebookUrl,
  flickr,
  instagram,
  linkedin,
  pinterest,
  tiktok,
  tripadvisor,
  twitter,
  twitterUrl,
  vimeo,
  vk,
  x,
  xing,
  youtube,
} from './social.js';
export { telegram, whatsapp } from './messenger.js';
export { bluesky, diaspora, gnusocial, mastodon, matrix, mobilizon } from './fediverse.js';
export { wikipedia, wikidata } from './wiki.js';
