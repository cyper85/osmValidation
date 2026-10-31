/**
 * Host name checks shared by the URL and mail validators. The host is
 * expected in the form `URL#hostname` returns it: lower case, IDN already
 * converted to punycode, IPv6 in brackets.
 */

export type HostKind = 'domain' | 'ipv4' | 'ipv6';

export function hostKind(hostname: string): HostKind {
  if (hostname.startsWith('[')) {
    return 'ipv6';
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return 'ipv4';
  }
  return 'domain';
}

const LABEL = /^(?!-)[a-z0-9_-]{1,63}(?<!-)$/;
const TLD = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/** A fully qualified domain name with at least two labels and a plausible TLD. */
export function isDomainName(hostname: string): boolean {
  const labels = hostname.replace(/\.$/, '').split('.');
  const tld = labels[labels.length - 1] ?? '';
  return labels.length >= 2 && labels.every((label) => LABEL.test(label)) && TLD.test(tld);
}

export function isLocalHost(hostname: string): boolean {
  switch (hostKind(hostname)) {
    case 'ipv4':
      return isLocalIPv4(hostname);
    case 'ipv6':
      return isLocalIPv6(hostname.slice(1, -1));
    case 'domain':
      return /(^|\.)(localhost|local|internal|home\.arpa)\.?$/.test(hostname);
  }
}

function isLocalIPv4(address: string): boolean {
  const [a = 0, b = 0] = address.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isLocalIPv6(address: string): boolean {
  if (address === '::' || address === '::1') {
    return true;
  }
  // IPv4-mapped, normalised by URL to ::ffff:xxxx:xxxx
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(address);
  if (mapped) {
    const high = parseInt(mapped[1] ?? '0', 16);
    const low = parseInt(mapped[2] ?? '0', 16);
    return isLocalIPv4([high >> 8, high & 0xff, low >> 8, low & 0xff].join('.'));
  }
  const first = parseInt(address.split(':')[0] || '0', 16);
  return (
    (first & 0xfe00) === 0xfc00 || // fc00::/7 unique local
    (first & 0xffc0) === 0xfe80 // fe80::/10 link local
  );
}
