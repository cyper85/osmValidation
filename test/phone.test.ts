import { describe, expect, it } from 'vitest';
import { isEmergencyNumber, phone } from '../src/index.js';

describe('phone', () => {
  it.each(['+49 111 2314-456', '+49 30 1234567', '+1 202 555 0143', '+43 1 5880', '+49 3677 69-0'])(
    'accepts %s',
    (value) => {
      expect(phone(value)).toMatchObject({ valid: true, code: 'PHONE_VALID' });
    },
  );

  it('accepts emergency numbers of any country without a country', () => {
    expect(phone('112')).toMatchObject({ valid: true, code: 'PHONE_EMERGENCY' });
    expect(phone('911')).toMatchObject({ valid: true, code: 'PHONE_EMERGENCY' });
  });

  it('checks emergency numbers per country', () => {
    expect(phone('110', { country: 'DE' })).toMatchObject({ valid: true, code: 'PHONE_EMERGENCY' });
    expect(phone('911', { country: 'DE' }).valid).toBe(false);
    expect(phone('144', { country: 'AT' }).valid).toBe(true);
    expect(isEmergencyNumber('144', 'DE')).toBe(false);
  });

  it.each([
    ['0111 23 14 45', 'PHONE_NOT_INTERNATIONAL'],
    ['+49 12', 'PHONE_INVALID'],
    ['+999 1234567', 'PHONE_INVALID'],
    ['+49 30 1234567 ext', 'PHONE_INVALID'],
    ['', 'PHONE_INVALID'],
  ])('rejects %s (%s)', (value, code) => {
    expect(phone(value)).toMatchObject({ valid: false, code });
  });

  it('suggests the international format for national numbers', () => {
    expect(phone('030 1234567', { country: 'DE' })).toMatchObject({
      valid: false,
      code: 'PHONE_NOT_INTERNATIONAL',
      suggestion: '+49 30 1234567',
    });
    expect(phone('030 1234567').suggestion).toBeUndefined();
  });

  it('suggests fixes for typical mistakes', () => {
    expect(phone('0049 30 1234567')).toMatchObject({ code: 'PHONE_IDD_PREFIX', suggestion: '+49 30 1234567' });
    expect(phone('+49 (0)30 1234567')).toMatchObject({ code: 'PHONE_TRUNK_PREFIX', suggestion: '+49 30 1234567' });
    expect(phone('tel:+49 30 1234567')).toMatchObject({ code: 'PHONE_TEL_PREFIX', suggestion: '+49 30 1234567' });
    expect(phone(' +49 30 1234567')).toMatchObject({ code: 'PHONE_WHITESPACE', suggestion: '+49 30 1234567' });
    expect(phone('tel:030 1234567', { country: 'DE' }).suggestion).toBe('+49 30 1234567');
  });
});

// the hyphen before an extension (DIN 5008) is allowed in OSM and stays in suggestions
describe('phone extension', () => {
  it.each([
    ['03677 6414-0', '+49 3677 6414-0'],
    ['03677 6414-12', '+49 3677 6414-12'],
    ['(03677) 6414-0', '+49 3677 6414-0'],
    ['03677/6414-0', '+49 3677 6414-0'],
    ['030 1234567-89', '+49 30 1234567-89'],
  ])('keeps it in the suggestion for %s', (value, suggestion) => {
    expect(phone(value, { country: 'DE' })).toMatchObject({ code: 'PHONE_NOT_INTERNATIONAL', suggestion });
  });

  it('keeps it when fixing the prefix', () => {
    expect(phone('0049 3677 6414-0').suggestion).toBe('+49 3677 6414-0');
    expect(phone('+49 (0)3677 6414-0').suggestion).toBe('+49 3677 6414-0');
  });

  it('accepts it in international numbers', () => {
    expect(phone('+49 3677 6414-0')).toMatchObject({ valid: true, code: 'PHONE_VALID' });
  });

  it('does not take a hyphen after the area code for an extension', () => {
    expect(phone('0361-12345', { country: 'DE' }).suggestion).toBe('+49 361 12345');
    expect(phone('030 1234567', { country: 'DE' }).suggestion).toBe('+49 30 1234567');
  });

  it('does not take hyphens between groups for an extension', () => {
    expect(phone('8 922 703-30-00', { country: 'RU' }).suggestion).toBe('+7 922 703 30 00');
  });
});

describe('phone without "+"', () => {
  it('suggests adding "+" for numbers with country code', () => {
    expect(phone('79865555505')).toMatchObject({ valid: false, code: 'PHONE_PLUS_MISSING', suggestion: '+7 986 555 55 05' });
    expect(phone('4930123456')).toMatchObject({ code: 'PHONE_PLUS_MISSING', suggestion: '+49 30 123456' });
  });

  it('prefers the national number if a country is given', () => {
    expect(phone('030123456', { country: 'DE' })).toMatchObject({ code: 'PHONE_NOT_INTERNATIONAL', suggestion: '+49 30 123456' });
  });
});
