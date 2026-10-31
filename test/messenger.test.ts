import { describe, expect, it } from 'vitest';
import { telegram, whatsapp } from '../src/index.js';

describe('whatsapp', () => {
  it('validates phone numbers with own codes', () => {
    expect(whatsapp('+49 151 23456789')).toMatchObject({ valid: true, code: 'WHATSAPP_VALID' });
    expect(whatsapp('0151 23456789', { country: 'DE' })).toMatchObject({
      valid: false,
      code: 'WHATSAPP_NOT_INTERNATIONAL',
      suggestion: '+49 1512 3456789',
    });
  });

  it('rejects emergency numbers', () => {
    expect(whatsapp('112')).toMatchObject({ valid: false, code: 'WHATSAPP_INVALID' });
  });

  it('converts links to a phone number', () => {
    expect(whatsapp('https://wa.me/4915123456789')).toMatchObject({
      valid: false,
      code: 'WHATSAPP_URL',
      suggestion: '+49 1512 3456789',
    });
    expect(whatsapp('https://api.whatsapp.com/send?phone=4915123456789').suggestion).toBe('+49 1512 3456789');
    expect(whatsapp('https://wa.me/message/ABCDEF').suggestion).toBeUndefined();
  });
});

describe('telegram', () => {
  it.each([
    ['https://t.me/novapostcorp', undefined],
    ['https://t.me/+AbCdEfGh123', undefined],
    ['https://t.me/tbank/', undefined],
    ['https://telegram.me/vkusvillbot', 'https://t.me/vkusvillbot'],
    ['t.me/novapostcorp', 'https://t.me/novapostcorp'],
  ])('accepts %s', (value, suggestion) => {
    expect(telegram(value)).toMatchObject({ valid: true, code: 'TELEGRAM_URL' });
    expect(telegram(value).suggestion).toBe(suggestion);
  });

  it('accepts phone numbers', () => {
    expect(telegram('+7 922 7033000')).toMatchObject({ valid: true, code: 'TELEGRAM_VALID' });
    expect(telegram('8 922 703-30-00', { country: 'RU' })).toMatchObject({
      code: 'TELEGRAM_NOT_INTERNATIONAL',
      suggestion: '+7 922 703 30 00',
    });
  });

  it('accepts usernames and suggests a link', () => {
    expect(telegram('wbshop_bot')).toMatchObject({ valid: true, code: 'TELEGRAM_USERNAME', suggestion: 'https://t.me/wbshop_bot' });
    expect(telegram('@KrasnoeBeloe').suggestion).toBe('https://t.me/KrasnoeBeloe');
  });

  it.each([
    ['https://t.me/s/novapostcorp', 'TELEGRAM_URL_SUBPAGE', 'https://t.me/novapostcorp'],
    ['https://t.me/novapostcorp/1234', 'TELEGRAM_INVALID', undefined],
    ['abc', 'TELEGRAM_INVALID', undefined],
  ])('rejects %s (%s)', (value, code, suggestion) => {
    expect(telegram(value)).toMatchObject({ valid: false, code });
    expect(telegram(value).suggestion).toBe(suggestion);
  });
});
