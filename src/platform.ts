import { fail, ok, type ValidationResult } from './result.js';

/** Profile found in a platform URL. */
export interface Profile {
  /** Path of the profile below `Platform#base`, without leading slash. */
  path: string;
  /** Query parameters that are part of the profile address, e.g. Facebook's `id`. */
  keep?: string[];
  /** The URL pointed to a subpage of the profile, which was removed. */
  trimmed?: boolean;
}

export interface Platform {
  /** Prefix of the result codes, e.g. "INSTAGRAM". */
  code: string;
  /** Name used in messages. */
  name: string;
  host: RegExp;
  /** Canonical URL prefix, e.g. "https://www.instagram.com/". */
  base: string;
  /** Whether a value is a plain username, e.g. "OpenStreetMap" or "@OpenStreetMap". */
  isUsername?: (value: string) => boolean;
  /**
   * The OSM wiki expects a full URL: usernames are invalid and get a URL
   * suggestion, if `usernamePath` is given.
   */
  urlOnly?: boolean;
  /**
   * Profile path for a username (without "@"). The URL is the suggestion for
   * a username; for platforms that also accept usernames, the username
   * stays valid.
   */
  usernamePath?: (username: string) => string;
  /** Finds the profile in the path segments of a URL on `host`. */
  profile: (segments: string[], url: URL) => Profile | undefined;
}

/**
 * Validates a value that is either a username or a URL to a profile on a
 * platform. URLs that are not in canonical form (https, generic host, no
 * trailing slash) get a suggestion; URLs with tracking parameters or
 * subpages are invalid, with the profile URL as suggestion.
 */
export function checkPlatform(value: string, platform: Platform): ValidationResult {
  const { code, name } = platform;

  if (platform.isUsername?.(value)) {
    const suggestion = platform.usernamePath === undefined
      ? undefined
      : platform.base + platform.usernamePath(value.replace(/^@/, ''));
    if (!platform.urlOnly) {
      return ok(`${code}_USERNAME`, `Valid ${name} username`, suggestion);
    }
    return fail(`${code}_USERNAME`, `Use the full URL of the ${name} profile instead of the username`, suggestion);
  }

  const parsed = parseUrl(value, platform.host);
  if (parsed === undefined) {
    return fail(
      `${code}_INVALID`,
      platform.urlOnly || platform.isUsername === undefined
        ? `Not a link to a ${name} profile`
        : `Neither a ${name} username nor a link to a ${name} profile`,
    );
  }

  const profile = platform.profile(pathSegments(parsed), parsed);
  if (profile === undefined) {
    return fail(`${code}_INVALID`, `URL does not point to a ${name} profile`);
  }

  const keep = profile.keep ?? [];
  const query = new URLSearchParams();
  for (const key of keep) {
    query.set(key, parsed.searchParams.get(key) ?? '');
  }
  const canonical = platform.base + profile.path + (keep.length > 0 ? `?${query.toString()}` : '');

  if (profile.trimmed) {
    return fail(`${code}_URL_SUBPAGE`, `${name} URL points to a subpage instead of the profile`, canonical);
  }
  const hasParameters = [...parsed.searchParams.keys()].some((key) => !keep.includes(key)) || parsed.hash !== '';
  if (hasParameters) {
    return fail(`${code}_URL_PARAMETERS`, `${name} URL contains parameters`, canonical);
  }
  return ok(`${code}_URL`, `Valid ${name} URL`, sameUrl(value, canonical) ? undefined : canonical);
}

/**
 * Profile of `length` path segments, optionally followed by one of the
 * known `subpages`, which is removed.
 */
export function profileWithSubpage(
  segments: string[],
  length: number,
  subpages: readonly string[] = [],
): Profile | undefined {
  const path = segments.slice(0, length).join('/');
  if (segments.length === length) {
    return { path };
  }
  const subpage = segments[length]?.toLowerCase() ?? '';
  return segments.length === length + 1 && subpages.includes(subpage) ? { path, trimmed: true } : undefined;
}

/** Parses a URL (protocol optional) and returns it only if the host matches. */
export function parseUrl(value: string, host?: RegExp): URL | undefined {
  if (/\s/.test(value)) {
    return undefined;
  }
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    return host === undefined || host.test(parsed.hostname) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Decoded, non-empty path segments. */
export function pathSegments(parsed: URL): string[] {
  return parsed.pathname
    .split('/')
    .filter((segment) => segment !== '')
    .map(decode);
}

export function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Equal apart from URL encoding and a trailing slash. */
export function sameUrl(a: string, b: string): boolean {
  const normalize = (url: string) => decode(url).replace(/\/$/, '');
  return normalize(a) === normalize(b);
}
