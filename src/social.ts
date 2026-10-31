import { fail, ok, type ValidationResult } from './result.js';

/*
 * The OSM wiki accepts both a username and a full URL for contact:facebook
 * and contact:twitter. A URL should use https, the generic domain and no
 * tracking parameters; such URLs get a canonical suggestion.
 */

const FACEBOOK_USERNAME = /^[a-z0-9.]{5,}$/i;
/** Page without username: name slug plus numeric ID, e.g. "Cafe-Mueller-1234567890". */
const FACEBOOK_PAGE_SLUG = /^[\p{L}\p{M}\p{N}._-]+-\d{5,}$/u;
const FACEBOOK_HOST = /^(?:(?:www|m|mobile|web|business|[a-z]{2}-[a-z]{2})\.)?(?:facebook|fb)\.com$/i;
const FACEBOOK_RESERVED = new Set(['pages', 'people', 'profile.php', 'groups', 'events', 'sharer', 'share', 'watch', 'login']);

/** Validates a Facebook page (`contact:facebook`, `facebook`). */
export function facebook(value: string): ValidationResult {
  if (FACEBOOK_USERNAME.test(value) || FACEBOOK_PAGE_SLUG.test(value)) {
    return ok('FACEBOOK_USERNAME', 'Valid Facebook username');
  }

  const parsed = parseUrl(value, FACEBOOK_HOST);
  if (parsed === undefined) {
    return fail('FACEBOOK_INVALID', 'Neither a Facebook username nor a link to a Facebook page');
  }

  const segments = pathSegments(parsed);
  const id = parsed.searchParams.get('id') ?? '';
  let path: string | undefined;
  if (segments.length === 1 && segments[0] === 'profile.php' && /^\d+$/.test(id)) {
    path = `profile.php?id=${id}`;
  } else if (segments.length === 1 && FACEBOOK_USERNAME.test(segments[0] ?? '') && !FACEBOOK_RESERVED.has(segments[0] ?? '')) {
    path = segments[0];
  } else if (segments.length === 1 && FACEBOOK_PAGE_SLUG.test(segments[0] ?? '')) {
    path = segments[0];
  } else if (segments.length === 2 && segments[0] === 'p' && FACEBOOK_PAGE_SLUG.test(segments[1] ?? '')) {
    path = segments.join('/');
  } else if (segments.length === 3 && (segments[0] === 'pages' || segments[0] === 'people') && /^\d{5,}$/.test(segments[2] ?? '')) {
    path = segments.join('/');
  }
  if (path === undefined) {
    return fail('FACEBOOK_INVALID', 'URL does not point to a Facebook page');
  }

  const canonical = `https://www.facebook.com/${path}`;
  const hasTracking = [...parsed.searchParams.keys()].some((key) => key !== 'id') || parsed.hash !== '';
  if (hasTracking) {
    return fail('FACEBOOK_URL_PARAMETERS', 'Facebook URL contains parameters', canonical);
  }
  return ok('FACEBOOK_URL', 'Valid Facebook URL', sameUrl(value, canonical) ? undefined : canonical);
}

/** Canonical URL for a Facebook username. */
export function facebookUrl(username: string): string {
  return `https://www.facebook.com/${username}`;
}

const TWITTER_USERNAME = /^@?([a-z0-9_]{1,15})$/i;
const TWITTER_HOST = /^(?:(?:www|mobile)\.)?(?:twitter|x)\.com$/i;
const TWITTER_RESERVED = new Set(['home', 'search', 'explore', 'hashtag', 'i', 'intent', 'share', 'settings', 'login', 'notifications', 'messages']);

/** Validates an X/Twitter account (`contact:twitter`, `contact:x`). */
export function twitter(value: string): ValidationResult {
  if (TWITTER_USERNAME.test(value)) {
    return ok('TWITTER_USERNAME', 'Valid X/Twitter username');
  }

  const parsed = parseUrl(value, TWITTER_HOST);
  if (parsed === undefined) {
    return fail('TWITTER_INVALID', 'Neither an X/Twitter username nor a link to an X/Twitter profile');
  }

  const segments = pathSegments(parsed);
  const username = TWITTER_USERNAME.exec(segments[0] ?? '')?.[1];
  if (segments.length !== 1 || username === undefined || TWITTER_RESERVED.has(username.toLowerCase())) {
    return fail('TWITTER_INVALID', 'URL does not point to an X/Twitter profile');
  }

  const canonical = twitterUrl(username);
  if (parsed.search !== '' || parsed.hash !== '') {
    return fail('TWITTER_URL_PARAMETERS', 'X/Twitter URL contains parameters', canonical);
  }
  return ok('TWITTER_URL', 'Valid X/Twitter URL', sameUrl(value, canonical) ? undefined : canonical);
}

/** X is the new name of Twitter. */
export const x = twitter;

/** Canonical URL for an X/Twitter username, with or without leading "@". */
export function twitterUrl(username: string): string {
  return `https://x.com/${username.replace(/^@/, '')}`;
}

/** Parses a URL (protocol optional) and returns it only if the host matches. */
function parseUrl(value: string, host: RegExp): URL | undefined {
  if (/\s/.test(value)) {
    return undefined;
  }
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    return host.test(parsed.hostname) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function pathSegments(parsed: URL): string[] {
  return parsed.pathname
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

/** Equal apart from a trailing slash. */
function sameUrl(a: string, b: string): boolean {
  return a.replace(/\/$/, '') === b;
}
