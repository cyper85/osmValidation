# osmValidation

Validates typical [OpenStreetMap](https://www.openstreetmap.org) tag values:
phone numbers, e-mail addresses, URLs, Facebook and X/Twitter accounts,
Wikipedia articles and Wikidata IDs. Where a value can be fixed
automatically, the result contains a suggestion.

The library only checks the format and works offline. Whether a target
actually exists (website reachable, Wikidata item present, …) is up to the
caller.

## Installation

```bash
npm install osmvalidation
```

ES module with TypeScript types, for Node.js ≥ 18 and browsers (via a bundler).

## Usage

```ts
import { phone, url, wikipedia, validateEach } from 'osmvalidation';

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

| Function | Tags | Codes |
| --- | --- | --- |
| `phone(value, { country? })` | `phone`, `contact:phone`, `fax` | `PHONE_VALID`, `PHONE_EMERGENCY`, `PHONE_INVALID`, `PHONE_NOT_INTERNATIONAL`, `PHONE_IDD_PREFIX`, `PHONE_TRUNK_PREFIX`, `PHONE_TEL_PREFIX`, `PHONE_WHITESPACE` |
| `mail(value)` | `email`, `contact:email` | `MAIL_VALID`, `MAIL_INVALID`, `MAIL_DOMAIN_INVALID`, `MAIL_LOCAL_ADDRESS`, `MAIL_MAILTO`, `MAIL_WHITESPACE` |
| `url(value)` | `website`, `contact:website`, `url` | `URL_VALID`, `URL_INVALID`, `URL_PROTOCOL_INVALID`, `URL_PROTOCOL_MISSING`, `URL_LOCAL_ADDRESS`, `URL_HOST_INVALID`, `URL_WHITESPACE` |
| `facebook(value)` | `contact:facebook` | `FACEBOOK_USERNAME`, `FACEBOOK_URL`, `FACEBOOK_URL_PARAMETERS`, `FACEBOOK_INVALID` |
| `twitter(value)`, `x(value)` | `contact:twitter`, `contact:x` | `TWITTER_USERNAME`, `TWITTER_URL`, `TWITTER_URL_PARAMETERS`, `TWITTER_INVALID` |
| `wikipedia(value)` | `wikipedia`, `*:wikipedia` | `WIKIPEDIA_VALID`, `WIKIPEDIA_URL`, `WIKIPEDIA_ENCODED`, `WIKIPEDIA_LANGUAGE_MISSING`, `WIKIPEDIA_INVALID` |
| `wikidata(value)` | `wikidata`, `*:wikidata` | `WIKIDATA_VALID`, `WIKIDATA_URL`, `WIKIDATA_FORMAT`, `WIKIDATA_INVALID` |

Helpers:

* `validateEach(value, validator)` / `splitValues(value)` for `;`-separated values
* `facebookUrl(username)`, `twitterUrl(username)` convert a username to the canonical URL
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
