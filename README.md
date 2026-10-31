# osmValidation

Validates typical [OpenStreetMap](https://www.openstreetmap.org) tag values:
phone numbers, e-mail addresses, URLs, social media and messenger accounts
(`contact:*`), Wikipedia articles and Wikidata IDs. Where a value can be fixed
automatically, the result contains a suggestion.

The library only checks the format and works offline. Whether a target
actually exists (website reachable, Wikidata item present, …) is up to the
caller.

## Installation

```bash
npm install osmvalidation
```

ES module with TypeScript types, for Node.js ≥ 22 and browsers (via a bundler).

## Usage

```ts
import { phone, url, wikipedia, validateEach, validateTag } from 'osmvalidation';

phone('030 1234567', { country: 'DE' });
// { valid: false, code: 'PHONE_NOT_INTERNATIONAL',
//   message: 'Phone number is not in international format …',
//   suggestion: '+49 30 1234567' }

url('https://server-börse.de');
// { valid: true, code: 'URL_VALID', message: 'URL is valid' }

wikipedia('https://de.wikipedia.org/wiki/ID_(OpenStreetMap)');
// { valid: false, code: 'WIKIPEDIA_URL', …, suggestion: 'de:ID (OpenStreetMap)' }

// values with several parts separated by ";"
validateEach('030 1234567;112', (v) => phone(v, { country: 'DE' }));
// { valid: false, results: [ … ], suggestion: '+49 30 1234567;112' }

// pick the validator from the key
validateTag('contact:telegram', 'wbshop_bot');
// { valid: true, results: [ … ], suggestion: 'https://t.me/wbshop_bot' }
```

Every validator returns a `ValidationResult`:

```ts
interface ValidationResult {
  valid: boolean;
  code: string;        // machine-readable, e.g. "URL_LOCAL_ADDRESS"
  message: string;     // English explanation
  suggestion?: string; // corrected value, if it can be fixed automatically
}
```

A valid result may carry a `suggestion` as well, if the value works but has a
preferred form (e.g. `https://twitter.com/x` → `https://x.com/x`).

## Validators

Accepted forms follow the [OSM wiki](https://wiki.openstreetmap.org/wiki/Key:contact:*).
`validatorFor(key)` returns the validator for an OSM key, `validateTag(key, value, options?)`
validates a whole tag including `;`-separated values.

### Contact data

| Function | Keys | Codes |
| --- | --- | --- |
| `phone(value, { country? })` | `phone`, `fax`, `contact:phone`, `contact:mobile`, `contact:fax`, `contact:sms`, `contact:tty` | `PHONE_VALID`, `PHONE_EMERGENCY`, `PHONE_INVALID`, `PHONE_NOT_INTERNATIONAL`, `PHONE_PLUS_MISSING`, `PHONE_IDD_PREFIX`, `PHONE_TRUNK_PREFIX`, `PHONE_TEL_PREFIX`, `PHONE_WHITESPACE` |
| `mail(value)` | `email`, `contact:email` | `MAIL_VALID`, `MAIL_INVALID`, `MAIL_DOMAIN_INVALID`, `MAIL_LOCAL_ADDRESS`, `MAIL_MAILTO`, `MAIL_WHITESPACE` |
| `url(value)`, `webcam(value)` | `website`, `url`, `contact:website`, `contact:webcam` | `URL_VALID`, `URL_INVALID`, `URL_PROTOCOL_INVALID`, `URL_PROTOCOL_MISSING`, `URL_LOCAL_ADDRESS`, `URL_HOST_INVALID`, `URL_WHITESPACE` |
| `whatsapp(value, { country? })` | `contact:whatsapp` | phone codes with prefix `WHATSAPP_`, plus `WHATSAPP_URL` (wa.me link → number) |
| `telegram(value, { country? })` | `contact:telegram` | `TELEGRAM_URL`, `TELEGRAM_USERNAME` (valid, t.me link as suggestion), phone codes with prefix `TELEGRAM_` |

### Social media

Each returns `<NAME>_USERNAME`, `<NAME>_URL`, `<NAME>_URL_PARAMETERS`,
`<NAME>_URL_SUBPAGE` or `<NAME>_INVALID`, e.g. `INSTAGRAM_URL`. URLs get the
canonical form as suggestion: https, generic host, no tracking parameters, no
subpage.

| Function | Key | Accepted |
| --- | --- | --- |
| `facebook` | `contact:facebook` | username or URL |
| `twitter`, `x` | `contact:twitter`, `contact:x` | username or URL (canonical: x.com) |
| `instagram` | `contact:instagram` | username or URL |
| `tiktok` | `contact:tiktok` | username or URL |
| `linkedin` | `contact:linkedin` | username or URL (`/company/`, `/in/`, `/school/`, `/showcase/`) |
| `xing` | `contact:xing` | username or URL (`/pages/`, `/companies/`, `/profile/`) |
| `vimeo` | `contact:vimeo` | username or URL |
| `youtube` | `contact:youtube` | URL only (`@handle` → URL suggestion) |
| `pinterest` | `contact:pinterest` | URL only (username → URL suggestion) |
| `flickr` | `contact:flickr` | URL only (user ID → URL suggestion) |
| `vk` | `contact:vk` | URL only (page name → URL suggestion) |
| `tripadvisor` | `contact:tripadvisor` | location ID (URL → ID suggestion); codes `TRIPADVISOR_VALID`, `TRIPADVISOR_FORMAT`, `TRIPADVISOR_URL`, `TRIPADVISOR_INVALID` |

### Decentralised networks

| Function | Key | Accepted | Codes |
| --- | --- | --- | --- |
| `mastodon` | `contact:mastodon` | `@user@server`, `https://server/@user` | `MASTODON_HANDLE`, `MASTODON_URL`, … |
| `mobilizon` | `contact:mobilizon` | `@user@server`, `https://server/@user` | `MOBILIZON_HANDLE`, `MOBILIZON_URL`, … |
| `diaspora` | `contact:diaspora` | `user@pod`, `https://pod/u/user`, `https://pod/people/<guid>` | `DIASPORA_HANDLE`, `DIASPORA_URL`, … |
| `gnusocial` | `contact:gnusocial` | `user@server`, `https://server/user` | `GNUSOCIAL_HANDLE`, `GNUSOCIAL_URL`, … |
| `bluesky` | `contact:bluesky` | `name.bsky.social`, `example.com`, DID, `https://bsky.app/profile/…` | `BLUESKY_HANDLE`, `BLUESKY_DID`, `BLUESKY_URL`, `BLUESKY_HANDLE_INCOMPLETE`, … |
| `matrix` | `contact:matrix` | `@user:server`, `#room:server` (matrix.to link → ID suggestion) | `MATRIX_USER`, `MATRIX_ROOM`, `MATRIX_URL`, `MATRIX_INVALID` |

### Wikipedia and Wikidata

| Function | Keys | Codes |
| --- | --- | --- |
| `wikipedia(value)` | `wikipedia`, `*:wikipedia` | `WIKIPEDIA_VALID`, `WIKIPEDIA_URL`, `WIKIPEDIA_ENCODED`, `WIKIPEDIA_LANGUAGE_MISSING`, `WIKIPEDIA_INVALID` |
| `wikidata(value)` | `wikidata`, `*:wikidata` | `WIKIDATA_VALID`, `WIKIDATA_URL`, `WIKIDATA_FORMAT`, `WIKIDATA_INVALID` |

### Helpers

* `validateTag(key, value, options?)`, `validatorFor(key)` pick the validator from the OSM key
* `validateEach(value, validator)` / `splitValues(value)` for `;`-separated values
* `facebookUrl(username)`, `twitterUrl(username)` convert a username to the canonical URL
* `formatInternational(number, country?)` formats a phone number, e.g. `+49 30 1234567`
* `isEmergencyNumber(number, country?)`, `EMERGENCY_NUMBERS` emergency numbers per country

Phone numbers are checked with [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js).
Pass the country (e.g. from `addr:country`) to get country-specific emergency
numbers and suggestions for numbers in national format. Without a country,
emergency numbers of all known countries are accepted.

## Migrating from 0.x

* ES module instead of a global object; the jQuery plugin and Bower are gone.
* Functions return a `ValidationResult` instead of a boolean plus `msg`.
* `google()` was removed (Google+ was shut down in 2019).
* `wikipedia()` requires the `language:Title` format; URLs and titles without
  a language are invalid (URLs come with a suggestion).
* E-mail addresses with an IP literal (`a@[1.2.3.4]`) are no longer accepted.

## Development

```bash
npm install
npm test        # vitest
npm run build   # TypeScript → dist/
```
