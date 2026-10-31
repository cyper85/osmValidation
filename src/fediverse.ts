import { isPublicDomain } from './host.js';
import { checkPlatform, decode, parseUrl, profileWithSubpage, type Profile } from './platform.js';
import { fail, ok, type ValidationResult } from './result.js';

/*
 * Decentralised networks: the value is a handle (user plus server) or the
 * full URL of the profile on its server.
 */

interface Network {
  code: string;
  name: string;
  /** Whether the handle starts with "@", e.g. "@user@server" (Mastodon) vs. "user@server" (diaspora*). */
  leadingAt: boolean;
  user: RegExp;
  /** Finds the profile in the path of a URL on any server. */
  profile: (segments: string[]) => Profile | undefined;
}

function checkNetwork(value: string, network: Network): ValidationResult {
  const { code, name } = network;

  const handle = /^(@?)([^@\s/]+)@([^@\s/]+)$/.exec(value);
  if (handle !== null) {
    const [, at = '', user = '', server = ''] = handle;
    if (!network.user.test(user) || !isPublicDomain(server)) {
      return fail(`${code}_INVALID`, `Not a valid ${name} handle`);
    }
    const canonical = `${network.leadingAt ? '@' : ''}${user}@${server}`;
    return ok(`${code}_HANDLE`, `Valid ${name} handle`, (at === '@') === network.leadingAt ? undefined : canonical);
  }

  if (!/^https?:\/\//i.test(value)) {
    return fail(`${code}_INVALID`, `Neither a ${name} handle nor a link to a ${name} profile`);
  }
  const hostname = parseUrl(value)?.hostname ?? '';
  if (!isPublicDomain(hostname)) {
    return fail(`${code}_INVALID`, `URL does not point to a public ${name} server`);
  }
  return checkPlatform(value, {
    code,
    name,
    host: new RegExp(`^${hostname.replace(/[.\\]/g, '\\$&')}$`, 'i'),
    base: `https://${hostname}/`,
    profile: network.profile,
  });
}

const FEDIVERSE_USER = /^[a-z0-9_]+(?:[a-z0-9_.-]*[a-z0-9_])?$/i;

/** "@user" or "@user@other.server" as first path segment. */
function atProfile(subpages: readonly string[]) {
  return (segments: string[]): Profile | undefined => {
    const [, user = '', server] = /^@([^@]+)(?:@(.+))?$/.exec(segments[0] ?? '') ?? [];
    return FEDIVERSE_USER.test(user) && (server === undefined || isPublicDomain(server))
      ? profileWithSubpage(segments, 1, subpages)
      : undefined;
  };
}

const MASTODON: Network = {
  code: 'MASTODON',
  name: 'Mastodon',
  leadingAt: true,
  user: FEDIVERSE_USER,
  profile: atProfile(['with_replies', 'media', 'followers', 'following']),
};

/** Validates a Mastodon account (`contact:mastodon`): "@user@server" or "https://server/@user". */
export function mastodon(value: string): ValidationResult {
  return checkNetwork(value, MASTODON);
}

const MOBILIZON: Network = {
  code: 'MOBILIZON',
  name: 'Mobilizon',
  leadingAt: true,
  user: FEDIVERSE_USER,
  profile: atProfile(['events', 'posts', 'resources', 'discussions']),
};

/** Validates a Mobilizon group or profile (`contact:mobilizon`). */
export function mobilizon(value: string): ValidationResult {
  return checkNetwork(value, MOBILIZON);
}

const DIASPORA: Network = {
  code: 'DIASPORA',
  name: 'diaspora*',
  leadingAt: false,
  user: /^[a-z0-9_.-]+$/i,
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    if (first === 'u' && /^[a-z0-9_.-]+$/i.test(second)) {
      return profileWithSubpage(segments, 2);
    }
    return first === 'people' && /^[0-9a-f]{16,32}$/i.test(second) ? profileWithSubpage(segments, 2) : undefined;
  },
};

/** Validates a diaspora* account (`contact:diaspora`): "user@pod" or a profile URL. */
export function diaspora(value: string): ValidationResult {
  return checkNetwork(value, DIASPORA);
}

const GNUSOCIAL_USER = /^[a-z0-9]{1,64}$/i;

const GNUSOCIAL: Network = {
  code: 'GNUSOCIAL',
  name: 'GNU social',
  leadingAt: false,
  user: GNUSOCIAL_USER,
  profile: (segments) => {
    const offset = segments[0] === 'index.php' ? 1 : 0;
    return GNUSOCIAL_USER.test(segments[offset] ?? '') ? profileWithSubpage(segments, offset + 1) : undefined;
  },
};

/** Validates a GNU social account (`contact:gnusocial`): "user@server" or a profile URL. */
export function gnusocial(value: string): ValidationResult {
  return checkNetwork(value, GNUSOCIAL);
}

const BLUESKY_DID = /^did:(?:plc:[a-z2-7]{24}|web:[a-z0-9.-]+)$/;

function isBlueskyHandle(handle: string): boolean {
  return /^[a-z0-9.-]+$/i.test(handle) && isPublicDomain(handle);
}

/**
 * Validates a Bluesky account (`contact:bluesky`): a handle like
 * "name.bsky.social" or "example.com", a DID or a bsky.app profile URL.
 */
export function bluesky(value: string): ValidationResult {
  if (BLUESKY_DID.test(value)) {
    return ok('BLUESKY_DID', 'Valid Bluesky DID');
  }
  const handle = value.replace(/^@/, '');
  if (isBlueskyHandle(handle)) {
    return ok('BLUESKY_HANDLE', 'Valid Bluesky handle', handle === value ? undefined : handle);
  }
  if (/^@?[a-z0-9-]{3,}$/i.test(value)) {
    return fail('BLUESKY_HANDLE_INCOMPLETE', 'Bluesky handle needs a domain, e.g. "name.bsky.social"', `${handle}.bsky.social`);
  }
  // "https://name.bsky.social/" instead of the handle
  const handleUrl = /^https?:\/\/([a-z0-9-]+\.bsky\.social)\/?$/i.exec(value)?.[1];
  if (handleUrl !== undefined) {
    return fail('BLUESKY_INVALID', 'Use the handle or the bsky.app profile URL', handleUrl.toLowerCase());
  }
  return checkPlatform(value, {
    code: 'BLUESKY',
    name: 'Bluesky',
    host: /^(?:www\.)?bsky\.app$/i,
    base: 'https://bsky.app/',
    profile: (segments) => {
      const [first = '', second = ''] = segments;
      return first === 'profile' && (isBlueskyHandle(second) || BLUESKY_DID.test(second))
        ? profileWithSubpage(segments, 2, ['feed', 'lists', 'media', 'likes'])
        : undefined;
    },
  });
}

const MATRIX_ID = /^([@#])([^:\s]+):([^\s:]+)(?::(\d{1,5}))?$/;

/**
 * Validates a Matrix user ("@user:server") or room alias ("#room:server")
 * (`contact:matrix`). Links to matrix.to are converted.
 */
export function matrix(value: string): ValidationResult {
  const id = MATRIX_ID.exec(value);
  if (id !== null) {
    const [, sigil, localpart = '', server = ''] = id;
    if (sigil === '@' && !/^[a-z0-9._=/+-]+$/i.test(localpart)) {
      return fail('MATRIX_INVALID', 'Matrix user name contains invalid characters');
    }
    if (!isPublicDomain(server)) {
      return fail('MATRIX_INVALID', 'Matrix server is not a public domain');
    }
    return sigil === '@'
      ? ok('MATRIX_USER', 'Valid Matrix user ID')
      : ok('MATRIX_ROOM', 'Valid Matrix room alias');
  }

  const parsed = parseUrl(value, /^matrix\.to$/i);
  if (parsed !== undefined) {
    // https://matrix.to/#/#room:server?via=…
    const target = decode(parsed.hash.replace(/^#\/?/, '').split('?')[0] ?? '');
    return fail('MATRIX_URL', 'Use the Matrix ID instead of a matrix.to link', MATRIX_ID.test(target) && matrix(target).valid ? target : undefined);
  }
  return fail('MATRIX_INVALID', 'Not a Matrix ID like "@user:server" or "#room:server"');
}
