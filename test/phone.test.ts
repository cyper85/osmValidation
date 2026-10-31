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

describe('phone without "+"', () => {
  it('suggests adding "+" for numbers with country code', () => {
    expect(phone('79865555505')).toMatchObject({ valid: false, code: 'PHONE_PLUS_MISSING', suggestion: '+7 986 555 55 05' });
    expect(phone('4930123456')).toMatchObject({ code: 'PHONE_PLUS_MISSING', suggestion: '+49 30 123456' });
  });

  it('prefers the national number if a country is given', () => {
    expect(phone('030123456', { country: 'DE' })).toMatchObject({ code: 'PHONE_NOT_INTERNATIONAL', suggestion: '+49 30 123456' });
  });
});
