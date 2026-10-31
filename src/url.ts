import { hostKind, isDomainName, isLocalHost } from './host.js';
import { fail, ok, type ValidationResult } from './result.js';

/**
 * Validates a website URL (`website`, `contact:website`, `url`, …).
 * Only http and https URLs to public hosts are accepted.
 */
export function url(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed !== value) {
    return fail('URL_WHITESPACE', 'URL has leading or trailing whitespace', suggest(trimmed));
  }

  if (!/^https?:\/\//i.test(value)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:/]+:\d+(\/|$)/.test(value)) {
      return fail('URL_PROTOCOL_INVALID', 'Only http and https URLs are allowed');
    }
    // Typical mistake: "www.example.com" without protocol
    return fail('URL_PROTOCOL_MISSING', 'URL has no protocol', suggest(`https://${value}`));
  }

  return check(value);
}

function check(value: string): ValidationResult {
  if (/\s/.test(value)) {
    return fail('URL_INVALID', 'URL contains whitespace');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return fail('URL_INVALID', 'URL cannot be parsed');
  }

  const { hostname } = parsed;
  if (isLocalHost(hostname)) {
    return fail('URL_LOCAL_ADDRESS', 'URL to a local service is not useful');
  }
  if (hostKind(hostname) === 'domain' && !isDomainName(hostname)) {
    return fail('URL_HOST_INVALID', 'Host is neither an IP address nor a fully qualified domain name');
  }
  return ok('URL_VALID', 'URL is valid');
}

/** Returns the candidate only if it is a valid URL itself. */
function suggest(candidate: string): string | undefined {
  return candidate !== '' && /^https?:\/\//i.test(candidate) && check(candidate).valid
    ? candidate
    : undefined;
}
