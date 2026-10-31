import { describe, expect, it } from 'vitest';
import { instagram, mail, phone, url, validateTag, validatorFor, webcam, wikidata, wikipedia } from '../src/index.js';

describe('validatorFor', () => {
  it.each([
    ['contact:phone', phone],
    ['contact:mobile', phone],
    ['phone', phone],
    ['email', mail],
    ['contact:website', url],
    ['contact:webcam', url],
    ['contact:instagram', instagram],
    ['wikipedia', wikipedia],
    ['brand:wikidata', wikidata],
    ['name:etymology:wikidata', wikidata],
  ])('%s', (key, validator) => {
    expect(validatorFor(key)).toBe(validator);
  });

  it.each(['name', 'contact:street', 'contact:constructor', 'constructor', 'wikidata_foo'])('has no validator for %s', (key) => {
    expect(validatorFor(key)).toBeUndefined();
  });

  it('exports webcam as URL validator', () => {
    expect(webcam).toBe(url);
  });
});

describe('validateTag', () => {
  it('validates all parts with options', () => {
    const result = validateTag('contact:phone', '030 1234567;112', { country: 'DE' });
    expect(result).toMatchObject({ valid: false, suggestion: '+49 30 1234567;112' });
  });

  it('returns undefined for unknown keys', () => {
    expect(validateTag('name', 'Café')).toBeUndefined();
  });
});
