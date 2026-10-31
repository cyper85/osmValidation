import { describe, expect, it } from 'vitest';
import { facebook, facebookUrl, twitter, twitterUrl, x } from '../src/index.js';

describe('facebook', () => {
  it.each([
    ['andreas.neumann.731', 'FACEBOOK_USERNAME'],
    ['https://www.facebook.com/pages/Printenbäckerei-Klein/144994602209929', 'FACEBOOK_URL'],
    ['https://www.facebook.com/pages/Khg-Bar/497072720344722', 'FACEBOOK_URL'],
    ['https://www.facebook.com/profile.php?id=100064123456789', 'FACEBOOK_URL'],
    ['https://www.facebook.com/OpenStreetMap/', 'FACEBOOK_URL'],
  ])('accepts %s', (value, code) => {
    expect(facebook(value)).toMatchObject({ valid: true, code });
    expect(facebook(value).suggestion).toBeUndefined();
  });

  it.each([
    'https://www.facebook.com/andreas.neumann.731/about',
    'https://f.com/OpenStreetMap',
    'https://www.facebook.com/groups/',
    'https://www.facebook.com/profile.php',
    'https://example.com/OpenStreetMap',
    'abc',
  ])('rejects %s', (value) => {
    expect(facebook(value)).toMatchObject({ valid: false });
  });

  it('suggests the canonical URL', () => {
    expect(facebook('http://m.facebook.com/OpenStreetMap')).toMatchObject({
      valid: true,
      suggestion: 'https://www.facebook.com/OpenStreetMap',
    });
    expect(facebook('facebook.com/OpenStreetMap').suggestion).toBe('https://www.facebook.com/OpenStreetMap');
    expect(facebook('https://www.facebook.com/OpenStreetMap?ref=bookmarks')).toMatchObject({
      valid: false,
      code: 'FACEBOOK_URL_PARAMETERS',
      suggestion: 'https://www.facebook.com/OpenStreetMap',
    });
  });

  it('converts a username to a URL', () => {
    expect(facebookUrl('OpenStreetMap')).toBe('https://www.facebook.com/OpenStreetMap');
  });
});

describe('twitter', () => {
  it.each([
    ['@nunAmen', 'TWITTER_USERNAME'],
    ['KSG_Ilmenau', 'TWITTER_USERNAME'],
    ['https://x.com/OpenStreetMap', 'TWITTER_URL'],
  ])('accepts %s', (value, code) => {
    expect(twitter(value)).toMatchObject({ valid: true, code });
    expect(twitter(value).suggestion).toBeUndefined();
  });

  it.each([
    ['https://www.twitter.com/OpenStreetMap', 'https://x.com/OpenStreetMap'],
    ['twitter.com/@github', 'https://x.com/github'],
    ['http://mobile.twitter.com/github/', 'https://x.com/github'],
  ])('accepts %s and suggests %s', (value, suggestion) => {
    expect(twitter(value)).toMatchObject({ valid: true, code: 'TWITTER_URL', suggestion });
  });

  it.each([
    'Thats-Wrong',
    'ThisNameIsWayTooLong',
    'https://twitter.de/github',
    'https://x.com/github/status/123',
    'https://x.com/home',
    'https://x.com/',
  ])('rejects %s', (value) => {
    expect(twitter(value).valid).toBe(false);
  });

  it('rejects parameters with a suggestion', () => {
    expect(twitter('https://x.com/github?s=20')).toMatchObject({
      valid: false,
      code: 'TWITTER_URL_PARAMETERS',
      suggestion: 'https://x.com/github',
    });
  });

  it('has x as an alias and converts usernames', () => {
    expect(x).toBe(twitter);
    expect(twitterUrl('@github')).toBe('https://x.com/github');
  });
});
