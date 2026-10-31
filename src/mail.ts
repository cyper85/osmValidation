import { isDomainName, isLocalHost } from './host.js';
import { fail, ok, type ValidationResult } from './result.js';

// dot-atom or quoted string, see RFC 5322; non-ASCII is allowed (RFC 6531)
const LOCAL_PART = /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|"(?:[^"\\\r\n]|\\.)+")$/;

/** Validates an e-mail address (`email`, `contact:email`). */
export function mail(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed !== value) {
    return fail('MAIL_WHITESPACE', 'E-mail address has leading or trailing whitespace', suggest(trimmed));
  }

  const mailto = /^mailto:/i;
  if (mailto.test(value)) {
    const address = value.replace(mailto, '').split('?')[0] ?? '';
    return fail('MAIL_MAILTO', 'E-mail address must not start with "mailto:"', suggest(address));
  }

  return check(value);
}

function check(value: string): ValidationResult {
  const at = value.lastIndexOf('@');
  const localPart = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (at < 1 || !LOCAL_PART.test(localPart) || localPart.length > 64) {
    return fail('MAIL_INVALID', 'E-mail address is invalid');
  }

  const hostname = toHostname(domain);
  if (hostname === undefined || !isDomainName(hostname)) {
    return fail('MAIL_DOMAIN_INVALID', 'Domain of the e-mail address is invalid');
  }
  if (isLocalHost(hostname)) {
    return fail('MAIL_LOCAL_ADDRESS', 'E-mail address with a local domain is not useful');
  }
  return ok('MAIL_VALID', 'E-mail address is valid');
}

/** Converts an (internationalised) domain to its ASCII form. */
function toHostname(domain: string): string | undefined {
  if (domain === '' || /[\s/?#:@[\]\\%]/.test(domain)) {
    return undefined;
  }
  try {
    return new URL(`http://${domain}/`).hostname;
  } catch {
    return undefined;
  }
}

function suggest(candidate: string): string | undefined {
  return check(candidate).valid ? candidate : undefined;
}
