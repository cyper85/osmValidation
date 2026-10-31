import { fail, ok, type ValidationResult } from './result.js';

// e.g. "de", "als", "simple", "zh-yue", "be-tarask", "zh-min-nan"
const LANGUAGE = /^([a-z]{2,12}(?:-[a-z0-9]{2,12})*):(.*)$/;
const NAMESPACES = /^(?:special|user|user[ _]talk|talk|file|image|category|template|help|portal|draft|module|mediawiki|wikipedia|wp)\s*:/i;
const WIKIPEDIA_URL = /^https?:\/\/([a-z0-9-]+)\.(?:m\.)?wikipedia\.org\//i;

/** Validates a Wikipedia article in the OSM format `language:Title` (`wikipedia`, `*:wikipedia`). */
export function wikipedia(value: string): ValidationResult {
  if (WIKIPEDIA_URL.test(value)) {
    return fail('WIKIPEDIA_URL', 'Use the format "language:Title" instead of a URL', fromUrl(value));
  }

  const match = LANGUAGE.exec(value);
  if (match === null || NAMESPACES.test(value)) {
    return fail('WIKIPEDIA_LANGUAGE_MISSING', 'Value must start with a language code, e.g. "en:Title"');
  }
  const [, language = '', title = ''] = match;

  const titleError = checkTitle(title);
  if (titleError !== undefined) {
    return titleError;
  }

  const normalized = `${language}:${normalizeTitle(title)}`;
  if (normalized !== value) {
    return /%[0-9a-f]{2}/i.test(title)
      ? fail('WIKIPEDIA_ENCODED', 'Title must not be URL-encoded', normalized)
      : ok('WIKIPEDIA_VALID', 'Valid Wikipedia article', normalized);
  }
  return ok('WIKIPEDIA_VALID', 'Valid Wikipedia article');
}

function checkTitle(title: string): ValidationResult | undefined {
  const invalid = (message: string) => fail('WIKIPEDIA_INVALID', message);
  if (title.trim() === '') {
    return invalid('Title is missing');
  }
  if (/~{3,}/.test(title) || /[#<>[\]|{}]/.test(title)) {
    return invalid('Title contains characters that are not allowed: # < > [ ] | { } ~~~');
  }
  if (/^:/.test(title) || NAMESPACES.test(title)) {
    return invalid('Title must refer to an article, not to another namespace');
  }
  if (/(^|\/)\.{1,2}(\/|$)/.test(title)) {
    return invalid('Title must not contain relative path segments');
  }
  return undefined;
}

/** "Foo_bar%C3%A4" → "Foo barä" */
function normalizeTitle(title: string): string {
  let decoded = title;
  try {
    decoded = decodeURIComponent(title);
  } catch {
    // keep as is
  }
  return decoded.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function fromUrl(value: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return undefined;
  }
  const language = WIKIPEDIA_URL.exec(value)?.[1]?.toLowerCase();
  const title = parsed.pathname.startsWith('/wiki/')
    ? parsed.pathname.slice('/wiki/'.length)
    : parsed.pathname === '/w/index.php'
      ? encodeURIComponent(parsed.searchParams.get('title') ?? '')
      : '';
  if (language === undefined || language === 'www' || parsed.hash !== '') {
    return undefined;
  }
  const suggestion = `${language}:${normalizeTitle(title)}`;
  return wikipedia(suggestion).valid ? suggestion : undefined;
}

const WIKIDATA_ID = /^Q[1-9]\d*$/;

/** Validates a Wikidata item ID (`wikidata`, `*:wikidata`). */
export function wikidata(value: string): ValidationResult {
  if (WIKIDATA_ID.test(value)) {
    return ok('WIKIDATA_VALID', 'Valid Wikidata ID');
  }

  const id = /^https?:\/\/(?:www\.|m\.)?wikidata\.org\/(?:wiki|entity)\/(Q[1-9]\d*)\/?$/i.exec(value)?.[1];
  if (id !== undefined) {
    return fail('WIKIDATA_URL', 'Use the plain ID instead of a URL', id.toUpperCase());
  }
  const trimmed = value.trim().toUpperCase();
  if (WIKIDATA_ID.test(trimmed)) {
    return fail('WIKIDATA_FORMAT', 'Wikidata ID must be an upper case "Q" followed by digits', trimmed);
  }
  return fail('WIKIDATA_INVALID', 'Not a Wikidata ID like "Q64"');
}
