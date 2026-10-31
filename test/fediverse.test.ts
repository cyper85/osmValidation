import { describe, expect, it } from 'vitest';
import { bluesky, diaspora, gnusocial, mastodon, matrix, mobilizon } from '../src/index.js';

describe('mastodon', () => {
  it.each([
    ['@realraum@chaos.social', 'MASTODON_HANDLE', undefined],
    ['muenchenstift@muenchen.social', 'MASTODON_HANDLE', '@muenchenstift@muenchen.social'],
    ['https://todon.nl/@myredlight', 'MASTODON_URL', undefined],
    ['https://social.bund.de/@bsi', 'MASTODON_URL', undefined],
    ['https://mastodon.social/@user@chaos.social', 'MASTODON_URL', undefined],
    ['http://ard.social/@NDR/', 'MASTODON_URL', 'https://ard.social/@NDR'],
  ])('accepts %s', (value, code, suggestion) => {
    expect(mastodon(value)).toMatchObject({ valid: true, code });
    expect(mastodon(value).suggestion).toBe(suggestion);
  });

  it.each([
    ['@user', 'MASTODON_INVALID'],
    ['@user@localhost', 'MASTODON_INVALID'],
    ['@us er@chaos.social', 'MASTODON_INVALID'],
    ['chaos.social/@realraum', 'MASTODON_INVALID'],
    ['https://chaos.social/realraum', 'MASTODON_INVALID'],
    ['https://chaos.social/@realraum/111222333444', 'MASTODON_INVALID'],
    ['https://192.168.0.1/@user', 'MASTODON_INVALID'],
  ])('rejects %s', (value, code) => {
    expect(mastodon(value)).toMatchObject({ valid: false, code });
  });

  it('removes subpages', () => {
    expect(mastodon('https://chaos.social/@realraum/with_replies')).toMatchObject({
      code: 'MASTODON_URL_SUBPAGE',
      suggestion: 'https://chaos.social/@realraum',
    });
  });
});

describe('mobilizon', () => {
  it('accepts handles and URLs', () => {
    expect(mobilizon('@openstreetmap@mobilizon.fr')).toMatchObject({ valid: true, code: 'MOBILIZON_HANDLE' });
    expect(mobilizon('https://mobilizon.fr/@openstreetmap')).toMatchObject({ valid: true, code: 'MOBILIZON_URL' });
    expect(mobilizon('https://mobilizon.fr/@openstreetmap/events')).toMatchObject({
      valid: false,
      suggestion: 'https://mobilizon.fr/@openstreetmap',
    });
  });
});

describe('diaspora', () => {
  it.each([
    ['rancho_electronico@diasp.org', 'DIASPORA_HANDLE', undefined],
    ['@rancho_electronico@diasp.org', 'DIASPORA_HANDLE', 'rancho_electronico@diasp.org'],
    ['https://pod.geraspora.de/u/spektralgraz', 'DIASPORA_URL', undefined],
    ['https://diaspora-fr.org/people/260916602afc0138b23046aac324e630', 'DIASPORA_URL', undefined],
  ])('accepts %s', (value, code, suggestion) => {
    expect(diaspora(value)).toMatchObject({ valid: true, code });
    expect(diaspora(value).suggestion).toBe(suggestion);
  });

  it.each(['spektralgraz', 'https://pod.geraspora.de/spektralgraz', 'https://diaspora-fr.org/people/xyz'])('rejects %s', (value) => {
    expect(diaspora(value).valid).toBe(false);
  });
});

describe('gnusocial', () => {
  it('accepts handles and URLs', () => {
    expect(gnusocial('openstreetmap@gnusocial.net')).toMatchObject({ valid: true, code: 'GNUSOCIAL_HANDLE' });
    expect(gnusocial('@openstreetmap@gnusocial.net')).toMatchObject({ valid: true, suggestion: 'openstreetmap@gnusocial.net' });
    expect(gnusocial('https://gnusocial.net/openstreetmap')).toMatchObject({ valid: true, code: 'GNUSOCIAL_URL' });
    expect(gnusocial('https://gnusocial.net/index.php/openstreetmap')).toMatchObject({ valid: true, code: 'GNUSOCIAL_URL' });
  });

  it('rejects invalid values', () => {
    expect(gnusocial('open_street@gnusocial.net').valid).toBe(false);
    expect(gnusocial('openstreetmap').valid).toBe(false);
  });
});

describe('bluesky', () => {
  it.each([
    ['stadtleipzig.bsky.social', 'BLUESKY_HANDLE', undefined],
    ['o2online.de', 'BLUESKY_HANDLE', undefined],
    ['@wgdrugstrategy.bsky.social', 'BLUESKY_HANDLE', 'wgdrugstrategy.bsky.social'],
    ['did:plc:z72i7hdynmk6r22z27h6tvur', 'BLUESKY_DID', undefined],
    ['https://bsky.app/profile/stadtleipzig.bsky.social', 'BLUESKY_URL', undefined],
    ['https://bsky.app/profile/aadl.org', 'BLUESKY_URL', undefined],
    ['https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur', 'BLUESKY_URL', undefined],
  ])('accepts %s', (value, code, suggestion) => {
    expect(bluesky(value)).toMatchObject({ valid: true, code });
    expect(bluesky(value).suggestion).toBe(suggestion);
  });

  it.each([
    ['stadtleipzig', 'BLUESKY_HANDLE_INCOMPLETE', 'stadtleipzig.bsky.social'],
    ['https://bsky.app/profile/stadtleipzig.bsky.social/post/3kabc', 'BLUESKY_INVALID', undefined],
    ['https://bsky.app/search?q=osm', 'BLUESKY_INVALID', undefined],
    ['user.localhost', 'BLUESKY_INVALID', undefined],
  ])('rejects %s (%s)', (value, code, suggestion) => {
    expect(bluesky(value)).toMatchObject({ valid: false, code });
    expect(bluesky(value).suggestion).toBe(suggestion);
  });
});

describe('matrix', () => {
  it.each([
    ['@user:matrix.org', 'MATRIX_USER'],
    ['#tillitis:matrix.org', 'MATRIX_ROOM'],
    ['#0x90.space:chat.heizhaus.org', 'MATRIX_ROOM'],
    ['#ccc.do:matrix.org', 'MATRIX_ROOM'],
    ['#room:example.com:8448', 'MATRIX_ROOM'],
  ])('accepts %s', (value, code) => {
    expect(matrix(value)).toMatchObject({ valid: true, code });
  });

  it('converts matrix.to links', () => {
    expect(matrix('https://matrix.to/#/#layer8:acmelabs.space')).toMatchObject({
      valid: false,
      code: 'MATRIX_URL',
      suggestion: '#layer8:acmelabs.space',
    });
    expect(matrix('https://matrix.to/#/%23ccc.do%3Amatrix.org?via=matrix.org').suggestion).toBe('#ccc.do:matrix.org');
    expect(matrix('https://matrix.to/#/@user:matrix.org').suggestion).toBe('@user:matrix.org');
  });

  it.each(['user:matrix.org', '@user', '#room:localhost', '@us er:matrix.org', '@user:matrix'])('rejects %s', (value) => {
    expect(matrix(value)).toMatchObject({ valid: false, code: 'MATRIX_INVALID' });
  });
});

describe('bluesky handle as URL', () => {
  it('suggests the handle', () => {
    expect(bluesky('https://germanyinusa.bsky.social/')).toMatchObject({ valid: false, suggestion: 'germanyinusa.bsky.social' });
  });
});
