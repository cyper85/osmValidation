import { describe, expect, it } from 'vitest';
import { phone, splitValues, url, validateEach } from '../src/index.js';

describe('validateEach', () => {
  it('splits at semicolons', () => {
    expect(splitValues('a; b ;c')).toEqual(['a', 'b', 'c']);
  });

  it('validates each part', () => {
    const result = validateEach('+49 30 1234567;112', (value) => phone(value, { country: 'DE' }));
    expect(result.valid).toBe(true);
    expect(result.results.map(({ result }) => result.code)).toEqual(['PHONE_VALID', 'PHONE_EMERGENCY']);
    expect(result.suggestion).toBeUndefined();
  });

  it('combines suggestions of all parts', () => {
    const result = validateEach('030 1234567; +49 30 7654321', (value) => phone(value, { country: 'DE' }));
    expect(result.valid).toBe(false);
    expect(result.suggestion).toBe('+49 30 1234567;+49 30 7654321');
  });

  it('suggests nothing if a part cannot be fixed', () => {
    const result = validateEach('www.example.com;ftp://example.com', url);
    expect(result.valid).toBe(false);
    expect(result.suggestion).toBeUndefined();
  });

  it('removes empty parts', () => {
    const result = validateEach('https://a.de;;https://b.de;', url);
    expect(result.valid).toBe(false);
    expect(result.suggestion).toBe('https://a.de;https://b.de');
  });
});
