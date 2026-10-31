import { describe, expect, it } from 'vitest';
import { mail } from '../src/index.js';

describe('mail', () => {
  it.each([
    'example@example.com',
    'first.last+tag@sub.example.co.uk',
    'info@müller.de',
    'jörg@example.com',
    '"john doe"@example.com',
  ])('accepts %s', (value) => {
    expect(mail(value)).toMatchObject({ valid: true, code: 'MAIL_VALID' });
  });

  it.each([
    ['example', 'MAIL_INVALID'],
    ['@example.com', 'MAIL_INVALID'],
    ['a..b@example.com', 'MAIL_INVALID'],
    ['a b@example.com', 'MAIL_INVALID'],
    ['example@example', 'MAIL_DOMAIN_INVALID'],
    ['example@exa_mple.c', 'MAIL_DOMAIN_INVALID'],
    ['example@example.com/x', 'MAIL_DOMAIN_INVALID'],
    ['root@localhost.localhost', 'MAIL_LOCAL_ADDRESS'],
  ])('rejects %s (%s)', (value, code) => {
    expect(mail(value)).toMatchObject({ valid: false, code });
  });

  it('suggests removing "mailto:"', () => {
    expect(mail('mailto:example@example.com')).toMatchObject({
      valid: false,
      code: 'MAIL_MAILTO',
      suggestion: 'example@example.com',
    });
    expect(mail('MAILTO:example@example.com?subject=Hi').suggestion).toBe('example@example.com');
    expect(mail('mailto:broken').suggestion).toBeUndefined();
  });

  it('suggests the trimmed value', () => {
    expect(mail('example@example.com ')).toMatchObject({
      code: 'MAIL_WHITESPACE',
      suggestion: 'example@example.com',
    });
  });
});
