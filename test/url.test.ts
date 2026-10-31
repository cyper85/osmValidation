import { describe, expect, it } from 'vitest';
import { url } from '../src/index.js';

describe('url', () => {
  it.each([
    'http://google.de/#test=test',
    'https://server-börse.de',
    'http://müller.de/x',
    'HtTpS://printer.box:8080/test/folder?get=default',
    'http://[2001:4860:0:2001::68]:80#!test',
    'https://user:pass@example.com/',
    'https://ab:cd@example.com',
    'https://8.8.8.8/dns',
  ])('accepts %s', (value) => {
    expect(url(value)).toMatchObject({ valid: true, code: 'URL_VALID' });
  });

  it.each([
    ['https://127.0.0.1/?ab=f', 'URL_LOCAL_ADDRESS'],
    ['https://127.0.0.1', 'URL_LOCAL_ADDRESS'],
    ['http://192.168.1.1', 'URL_LOCAL_ADDRESS'],
    ['http://172.20.0.1', 'URL_LOCAL_ADDRESS'],
    ['http://[::1]:443', 'URL_LOCAL_ADDRESS'],
    ['http://[fe80::1]', 'URL_LOCAL_ADDRESS'],
    ['http://[fd00::1]', 'URL_LOCAL_ADDRESS'],
    ['http://[::ffff:127.0.0.1]', 'URL_LOCAL_ADDRESS'],
    ['http://localhost:8080', 'URL_LOCAL_ADDRESS'],
    ['http://drucker.local', 'URL_LOCAL_ADDRESS'],
    ['file:///C:\\test', 'URL_PROTOCOL_INVALID'],
    ['ftp://example.com', 'URL_PROTOCOL_INVALID'],
    ['https:/example.com', 'URL_PROTOCOL_INVALID'],
    ['http://a.b?x', 'URL_HOST_INVALID'],
    ['http://intranet/', 'URL_HOST_INVALID'],
    ['http://-foo.de', 'URL_HOST_INVALID'],
    ['http://exa mple.com', 'URL_INVALID'],
    ['http://', 'URL_INVALID'],
  ])('rejects %s (%s)', (value, code) => {
    expect(url(value)).toMatchObject({ valid: false, code });
  });

  it('suggests a protocol if missing', () => {
    expect(url('www.example.com/path')).toMatchObject({
      valid: false,
      code: 'URL_PROTOCOL_MISSING',
      suggestion: 'https://www.example.com/path',
    });
    expect(url('example.com:8080')).toMatchObject({
      code: 'URL_PROTOCOL_MISSING',
      suggestion: 'https://example.com:8080',
    });
    expect(url('localhost').suggestion).toBeUndefined();
  });

  it('suggests the trimmed value', () => {
    expect(url(' https://example.com ')).toMatchObject({
      valid: false,
      code: 'URL_WHITESPACE',
      suggestion: 'https://example.com',
    });
  });
});
