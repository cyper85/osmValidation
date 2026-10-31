import { checkPlatform, parseUrl, profileWithSubpage, type Platform } from './platform.js';
import { fail, ok, type ValidationResult } from './result.js';

/*
 * Accepted forms follow https://wiki.openstreetmap.org/wiki/Key:contact:*
 * Most platforms accept a username or a full URL. A URL should use https,
 * the generic domain and no tracking parameters; such URLs get a canonical
 * suggestion.
 */

const FACEBOOK_USERNAME = /^[a-z0-9.]{5,}$/i;
/** Some old pages have shorter names, e.g. facebook.com/mts. */
const FACEBOOK_URL_NAME = /^[a-z0-9.]{2,}$/i;
/** Page without username: name slug plus numeric ID, e.g. "Cafe-Mueller-1234567890". */
const FACEBOOK_PAGE_SLUG = /^[\p{L}\p{M}\p{N}._-]+-\d{5,}$/u;
const FACEBOOK_RESERVED = ['p', 'pages', 'people', 'profile.php', 'groups', 'events', 'sharer', 'share', 'watch', 'login'];
const FACEBOOK_SUBPAGES = ['about', 'posts', 'photos', 'videos', 'reviews', 'events', 'community', 'reels', 'mentions'];

const FACEBOOK: Platform = {
  code: 'FACEBOOK',
  name: 'Facebook',
  host: /^(?:(?:www|m|mobile|web|business|[a-z]{2}-[a-z]{2})\.)?(?:facebook|fb)\.com$/i,
  base: 'https://www.facebook.com/',
  isUsername: (value) => FACEBOOK_USERNAME.test(value) || FACEBOOK_PAGE_SLUG.test(value),
  profile: (segments, url) => {
    const [first = '', second = '', third = ''] = segments;
    if (first === 'profile.php') {
      return segments.length === 1 && /^\d+$/.test(url.searchParams.get('id') ?? '')
        ? { path: first, keep: ['id'] }
        : undefined;
    }
    if ((FACEBOOK_URL_NAME.test(first) && !FACEBOOK_RESERVED.includes(first)) || FACEBOOK_PAGE_SLUG.test(first)) {
      return profileWithSubpage(segments, 1, FACEBOOK_SUBPAGES);
    }
    if (first === 'p' && FACEBOOK_PAGE_SLUG.test(second)) {
      return profileWithSubpage(segments, 2, FACEBOOK_SUBPAGES);
    }
    if ((first === 'pages' || first === 'people') && /^\d{5,}$/.test(third)) {
      return profileWithSubpage(segments, 3, FACEBOOK_SUBPAGES);
    }
    return undefined;
  },
};

/** Validates a Facebook page (`contact:facebook`). */
export function facebook(value: string): ValidationResult {
  return checkPlatform(value, FACEBOOK);
}

/** Canonical URL for a Facebook username. */
export function facebookUrl(username: string): string {
  return FACEBOOK.base + username;
}

const TWITTER_USERNAME = /^@?([a-z0-9_]{1,15})$/i;
const TWITTER_RESERVED = ['home', 'search', 'explore', 'hashtag', 'i', 'intent', 'share', 'settings', 'login', 'notifications', 'messages'];

const TWITTER: Platform = {
  code: 'TWITTER',
  name: 'X/Twitter',
  host: /^(?:(?:www|mobile)\.)?(?:twitter|x)\.com$/i,
  base: 'https://x.com/',
  isUsername: (value) => TWITTER_USERNAME.test(value),
  profile: ([first = '', ...rest]) => {
    const username = TWITTER_USERNAME.exec(first)?.[1];
    return username === undefined || TWITTER_RESERVED.includes(username.toLowerCase())
      ? undefined
      : profileWithSubpage([username, ...rest], 1, ['with_replies', 'media', 'likes', 'highlights', 'articles']);
  },
};

/** Validates an X/Twitter account (`contact:twitter`, `contact:x`). */
export function twitter(value: string): ValidationResult {
  return checkPlatform(value, TWITTER);
}

/** X is the new name of Twitter. */
export const x = twitter;

/** Canonical URL for an X/Twitter username, with or without leading "@". */
export function twitterUrl(username: string): string {
  return TWITTER.base + username.replace(/^@/, '');
}

const INSTAGRAM_USERNAME = /^@?(?!\.)(?!.*\.\.)[a-z0-9._]{1,30}(?<!\.)$/i;
const INSTAGRAM_RESERVED = ['p', 'reel', 'reels', 'tv', 'explore', 'stories', 'accounts', 'direct', 'about', 'developer', 'legal'];

const INSTAGRAM: Platform = {
  code: 'INSTAGRAM',
  name: 'Instagram',
  host: /^(?:(?:www|m)\.)?(?:instagram\.com|instagr\.am)$/i,
  base: 'https://www.instagram.com/',
  isUsername: (value) => INSTAGRAM_USERNAME.test(value),
  profile: (segments) => {
    const [first = ''] = segments;
    return INSTAGRAM_USERNAME.test(first) && !first.startsWith('@') && !INSTAGRAM_RESERVED.includes(first.toLowerCase())
      ? profileWithSubpage(segments, 1, ['reels', 'tagged', 'guides'])
      : undefined;
  },
};

/** Validates an Instagram account (`contact:instagram`). */
export function instagram(value: string): ValidationResult {
  return checkPlatform(value, INSTAGRAM);
}

const TIKTOK_USERNAME = /^@?[a-z0-9._]{2,24}$/i;

const TIKTOK: Platform = {
  code: 'TIKTOK',
  name: 'TikTok',
  host: /^(?:(?:www|m)\.)?tiktok\.com$/i,
  base: 'https://www.tiktok.com/',
  isUsername: (value) => TIKTOK_USERNAME.test(value),
  profile: (segments) => {
    const [first = ''] = segments;
    return first.startsWith('@') && TIKTOK_USERNAME.test(first) ? profileWithSubpage(segments, 1) : undefined;
  },
};

/** Validates a TikTok account (`contact:tiktok`). */
export function tiktok(value: string): ValidationResult {
  return checkPlatform(value, TIKTOK);
}

const YOUTUBE_HANDLE = /^@[\p{L}\p{N}._-]{3,30}$/u;
const YOUTUBE_NAME = /^[a-z0-9_.-]+$/i;
const YOUTUBE_RESERVED = ['watch', 'playlist', 'results', 'shorts', 'feed', 'embed', 'live', 'hashtag', 'redirect', 'about', 't', 'premium', 'gaming', 'account', 'signin'];
const YOUTUBE_SUBPAGES = ['featured', 'videos', 'shorts', 'streams', 'playlists', 'community', 'channels', 'about', 'live', 'podcasts', 'search', 'posts'];

const YOUTUBE: Platform = {
  code: 'YOUTUBE',
  name: 'YouTube',
  host: /^(?:(?:www|m)\.)?youtube\.com$/i,
  base: 'https://www.youtube.com/',
  isUsername: (value) => YOUTUBE_HANDLE.test(value),
  urlOnly: true,
  usernamePath: (handle) => `@${handle}`,
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    if (YOUTUBE_HANDLE.test(first)) {
      return profileWithSubpage(segments, 1, YOUTUBE_SUBPAGES);
    }
    if ((first === 'channel' && /^UC[\w-]{22}$/.test(second)) || ((first === 'c' || first === 'user') && YOUTUBE_NAME.test(second))) {
      return profileWithSubpage(segments, 2, YOUTUBE_SUBPAGES);
    }
    // legacy custom URL, e.g. youtube.com/sberbank
    if (YOUTUBE_NAME.test(first) && !YOUTUBE_RESERVED.includes(first.toLowerCase())) {
      return profileWithSubpage(segments, 1, YOUTUBE_SUBPAGES);
    }
    return undefined;
  },
};

/** Validates a YouTube channel URL (`contact:youtube`). */
export function youtube(value: string): ValidationResult {
  return checkPlatform(value, YOUTUBE);
}

const SLUG = /^[\p{L}\p{M}\p{N}_-]{2,100}$/u;
/** Decoded path segment, e.g. "mcdonald's-corporation" or "tmgedsgmbh&co.kg". */
const URL_SLUG = /^[^\s/?#]{2,200}$/u;

const LINKEDIN: Platform = {
  code: 'LINKEDIN',
  name: 'LinkedIn',
  host: /^(?:(?:www|[a-z]{2})\.)?linkedin\.com$/i,
  base: 'https://www.linkedin.com/',
  isUsername: (value) => SLUG.test(value),
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    return ['company', 'in', 'school', 'showcase'].includes(first) && URL_SLUG.test(second)
      ? profileWithSubpage(segments, 2, ['about', 'posts', 'jobs', 'life', 'people', 'videos', 'events', 'recent-activity'])
      : undefined;
  },
};

/** Validates a LinkedIn profile or company page (`contact:linkedin`). */
export function linkedin(value: string): ValidationResult {
  return checkPlatform(value, LINKEDIN);
}

const XING: Platform = {
  code: 'XING',
  name: 'XING',
  host: /^(?:www\.)?xing\.com$/i,
  base: 'https://www.xing.com/',
  isUsername: (value) => SLUG.test(value),
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    return ['pages', 'companies', 'company', 'profile'].includes(first) && URL_SLUG.test(second)
      ? profileWithSubpage(segments, 2, ['news', 'jobs'])
      : undefined;
  },
};

/** Validates a XING profile or company page (`contact:xing`). */
export function xing(value: string): ValidationResult {
  return checkPlatform(value, XING);
}

const PINTEREST_USERNAME = /^@?[a-z0-9_]{3,30}$/i;
const PINTEREST_URL_NAME = /^[a-z0-9_]{1,30}$/i;
const PINTEREST_RESERVED = ['pin', 'search', 'ideas', 'today', 'business', 'categories', 'explore', 'login', 'settings'];

const PINTEREST: Platform = {
  code: 'PINTEREST',
  name: 'Pinterest',
  host: /^(?:(?:www|[a-z]{2})\.)?pinterest\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/i,
  base: 'https://www.pinterest.com/',
  isUsername: (value) => PINTEREST_USERNAME.test(value),
  urlOnly: true,
  usernamePath: (username) => username,
  profile: (segments) => {
    const [first = '', second] = segments;
    if (!PINTEREST_URL_NAME.test(first) ||PINTEREST_RESERVED.includes(first.toLowerCase())) {
      return undefined;
    }
    // second segment is a board, unless it is one of the profile tabs
    return second === undefined || second.startsWith('_')
      ? profileWithSubpage(segments, 1, ['_created', '_saved', '_boards'])
      : profileWithSubpage(segments, 2);
  },
};

/** Validates a Pinterest profile or board URL (`contact:pinterest`). */
export function pinterest(value: string): ValidationResult {
  return checkPlatform(value, PINTEREST);
}

const VIMEO_USERNAME = /^(?!\d+$)[a-z0-9_]{2,}$/i;
const VIMEO_RESERVED = ['groups', 'showcase', 'categories', 'watch', 'search', 'ondemand', 'upgrade', 'features', 'blog', 'help', 'join', 'log_in'];

const VIMEO: Platform = {
  code: 'VIMEO',
  name: 'Vimeo',
  host: /^(?:www\.)?vimeo\.com$/i,
  base: 'https://vimeo.com/',
  isUsername: (value) => VIMEO_USERNAME.test(value),
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    if (first === 'channels') {
      return VIMEO_USERNAME.test(second) ? profileWithSubpage(segments, 2) : undefined;
    }
    // purely numeric paths are videos
    return VIMEO_USERNAME.test(first) && !VIMEO_RESERVED.includes(first.toLowerCase())
      ? profileWithSubpage(segments, 1, ['videos', 'about', 'showcases', 'channels'])
      : undefined;
  },
};

/** Validates a Vimeo account (`contact:vimeo`). */
export function vimeo(value: string): ValidationResult {
  return checkPlatform(value, VIMEO);
}

/** Flickr user ID, e.g. "78801951@N00". */
const FLICKR_NSID = /^\d+@N\d{2}$/;

const FLICKR: Platform = {
  code: 'FLICKR',
  name: 'Flickr',
  host: /^(?:www\.)?flickr\.com$/i,
  base: 'https://www.flickr.com/',
  isUsername: (value) => FLICKR_NSID.test(value),
  urlOnly: true,
  usernamePath: (nsid) => `photos/${nsid}`,
  profile: (segments) => {
    const [first = '', second = ''] = segments;
    return (first === 'photos' || first === 'people') && /^[\w@.-]+$/.test(second)
      ? profileWithSubpage(segments, 2, ['albums', 'collections', 'favorites', 'galleries', 'with'])
      : undefined;
  },
};

/** Validates a Flickr profile URL (`contact:flickr`). */
export function flickr(value: string): ValidationResult {
  return checkPlatform(value, FLICKR);
}

const VK_RESERVED = ['feed', 'im', 'search', 'friends', 'groups', 'audio', 'video', 'music', 'settings', 'login', 'apps', 'away.php'];

/** Page name, e.g. "sberbank" or "yandex.market". */
const VK_NAME = /^[a-z0-9_.]{2,32}$/i;
/** Plain page name, but not a domain like "VK.com". */
const VK_PLAIN_NAME = /^(?!.*\.[a-z]{2,}$)[a-z0-9_.]{5,32}$/i;

const VK: Platform = {
  code: 'VK',
  name: 'VK',
  host: /^(?:(?:www|m)\.)?vk\.(?:com|ru)$/i,
  base: 'https://vk.com/',
  isUsername: (value) => VK_PLAIN_NAME.test(value),
  urlOnly: true,
  usernamePath: (name) => name,
  profile: (segments) => {
    const [first = ''] = segments;
    return VK_NAME.test(first) && !VK_RESERVED.includes(first.toLowerCase())
      ? profileWithSubpage(segments, 1)
      : undefined;
  },
};

/** Validates a VK page URL (`contact:vk`). */
export function vk(value: string): ValidationResult {
  return checkPlatform(value, VK);
}

const TRIPADVISOR_ID = /^[1-9]\d{2,11}$/;

/**
 * Validates a Tripadvisor location ID (`contact:tripadvisor`), the number
 * after "-d" in the URL of the location.
 */
export function tripadvisor(value: string): ValidationResult {
  if (TRIPADVISOR_ID.test(value)) {
    return ok('TRIPADVISOR_VALID', 'Valid Tripadvisor location ID');
  }
  // "d1234567" or "g187323-d1234567" from the URL
  const prefixed = /^(?:g\d+-)?d(\d+)$/i.exec(value)?.[1];
  if (prefixed !== undefined && TRIPADVISOR_ID.test(prefixed)) {
    return fail('TRIPADVISOR_FORMAT', 'Use the number without the "d"', prefixed);
  }
  const parsed = parseUrl(value, /(^|\.)tripadvisor\.[a-z]{2,3}(\.[a-z]{2})?$/i);
  if (parsed !== undefined) {
    const id = /-d(\d+)(?:-|\.html|$)/.exec(parsed.pathname)?.[1];
    return fail(
      'TRIPADVISOR_URL',
      'Use the Tripadvisor location ID instead of the URL',
      id !== undefined && TRIPADVISOR_ID.test(id) ? id : undefined,
    );
  }
  return fail('TRIPADVISOR_INVALID', 'Not a Tripadvisor location ID');
}
