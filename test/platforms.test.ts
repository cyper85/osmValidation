import { describe, expect, it } from 'vitest';
import {
  flickr,
  instagram,
  linkedin,
  pinterest,
  tiktok,
  tripadvisor,
  vimeo,
  vk,
  xing,
  youtube,
  type ValidationResult,
} from '../src/index.js';

type Case = [value: string, code: string, suggestion?: string];

function check(validator: (value: string) => ValidationResult, valid: Case[], invalid: Case[]) {
  it.each(valid)('accepts %s (%s)', (value, code, suggestion) => {
    expect(validator(value)).toMatchObject({ valid: true, code });
    expect(validator(value).suggestion).toBe(suggestion);
  });
  it.each(invalid)('rejects %s (%s)', (value, code, suggestion) => {
    expect(validator(value)).toMatchObject({ valid: false, code });
    expect(validator(value).suggestion).toBe(suggestion);
  });
}

describe('instagram', () => {
  check(
    instagram,
    [
      ['openstreetmap', 'INSTAGRAM_USERNAME'],
      ['@cafe.mueller_ilmenau', 'INSTAGRAM_USERNAME'],
      ['https://www.instagram.com/openstreetmap', 'INSTAGRAM_URL'],
      ['https://www.instagram.com/openstreetmap/', 'INSTAGRAM_URL'],
      ['instagram.com/openstreetmap', 'INSTAGRAM_URL', 'https://www.instagram.com/openstreetmap'],
    ],
    [
      ['.dot', 'INSTAGRAM_INVALID'],
      ['a..b', 'INSTAGRAM_INVALID'],
      ['https://www.instagram.com/p/C1a2b3c4d5/', 'INSTAGRAM_INVALID'],
      ['https://www.instagram.com/openstreetmap/?hl=de', 'INSTAGRAM_URL_PARAMETERS', 'https://www.instagram.com/openstreetmap'],
      ['https://www.instagram.com/openstreetmap/reels/', 'INSTAGRAM_URL_SUBPAGE', 'https://www.instagram.com/openstreetmap'],
    ],
  );
});

describe('tiktok', () => {
  check(
    tiktok,
    [
      ['@openstreetmap', 'TIKTOK_USERNAME'],
      ['cafe.mueller', 'TIKTOK_USERNAME'],
      ['https://www.tiktok.com/@openstreetmap', 'TIKTOK_URL'],
      ['tiktok.com/@openstreetmap', 'TIKTOK_URL', 'https://www.tiktok.com/@openstreetmap'],
    ],
    [
      ['https://www.tiktok.com/openstreetmap', 'TIKTOK_INVALID'],
      ['https://www.tiktok.com/@openstreetmap/video/7123456789', 'TIKTOK_INVALID'],
      ['https://www.tiktok.com/@openstreetmap?lang=de', 'TIKTOK_URL_PARAMETERS', 'https://www.tiktok.com/@openstreetmap'],
    ],
  );
});

describe('youtube', () => {
  check(
    youtube,
    [
      ['https://www.youtube.com/@OpenStreetMap', 'YOUTUBE_URL'],
      ['https://www.youtube.com/channel/UCZubjROY1tbvANdCcehe4NQ', 'YOUTUBE_URL'],
      ['https://www.youtube.com/channel/UC-Lv4AkW50HM80ZZQEq8Sqw/', 'YOUTUBE_URL'],
      ['https://www.youtube.com/user/magyarpostaofficial', 'YOUTUBE_URL'],
      ['https://www.youtube.com/sberbank', 'YOUTUBE_URL'],
      ['https://youtube.com/user/BankofGeorgiaTV', 'YOUTUBE_URL', 'https://www.youtube.com/user/BankofGeorgiaTV'],
      ['http://www.youtube.com/channel/UCtA26dq4YyHMc0bMZfPIaXA', 'YOUTUBE_URL', 'https://www.youtube.com/channel/UCtA26dq4YyHMc0bMZfPIaXA'],
    ],
    [
      ['@OpenStreetMap', 'YOUTUBE_USERNAME', 'https://www.youtube.com/@OpenStreetMap'],
      ['foxpost_official', 'YOUTUBE_INVALID'],
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'YOUTUBE_INVALID'],
      ['https://youtu.be/dQw4w9WgXcQ', 'YOUTUBE_INVALID'],
      ['https://www.youtube.com/channel/UCshort', 'YOUTUBE_INVALID'],
      ['https://www.youtube.com/@OpenStreetMap/videos', 'YOUTUBE_URL_SUBPAGE', 'https://www.youtube.com/@OpenStreetMap'],
      ['https://www.youtube.com/@OpenStreetMap?si=abc', 'YOUTUBE_URL_PARAMETERS', 'https://www.youtube.com/@OpenStreetMap'],
    ],
  );
});

describe('linkedin', () => {
  check(
    linkedin,
    [
      ['bank-of-georgia', 'LINKEDIN_USERNAME'],
      ['https://www.linkedin.com/company/ukrposhta', 'LINKEDIN_URL'],
      ['https://www.linkedin.com/company/tbc-bank/', 'LINKEDIN_URL'],
      ['https://www.linkedin.com/in/max-mustermann-123456', 'LINKEDIN_URL'],
      ['https://linkedin.com/company/bank-of-georgia', 'LINKEDIN_URL', 'https://www.linkedin.com/company/bank-of-georgia'],
      ['https://de.linkedin.com/company/ukrposhta', 'LINKEDIN_URL', 'https://www.linkedin.com/company/ukrposhta'],
      [
        'https://linkedin.com/company/2-%E1%83%9C%E1%83%90%E1%83%91%E1%83%98%E1%83%AF%E1%83%98-2-nabiji',
        'LINKEDIN_URL',
        'https://www.linkedin.com/company/2-ნაბიჯი-2-nabiji',
      ],
    ],
    [
      ['https://www.linkedin.com/company/algerieposte/posts/?feedView=all', 'LINKEDIN_URL_SUBPAGE', 'https://www.linkedin.com/company/algerieposte'],
      ['https://www.linkedin.com/feed/', 'LINKEDIN_INVALID'],
      ['https://www.linkedin.com/company/', 'LINKEDIN_INVALID'],
    ],
  );
});

describe('xing', () => {
  check(
    xing,
    [
      ['SPARKASSEWITTEN', 'XING_USERNAME'],
      ['https://www.xing.com/pages/diakonie-leipzig', 'XING_URL'],
      ['https://www.xing.com/companies/nextbikegmbh', 'XING_URL'],
      ['https://www.xing.com/profile/Max_Mustermann', 'XING_URL'],
      ['https://xing.com/pages/lidl', 'XING_URL', 'https://www.xing.com/pages/lidl'],
    ],
    [
      ['https://www.xing.com/jobs', 'XING_INVALID'],
      ['https://www.xing.com/pages/lidl?sc_o=abc', 'XING_URL_PARAMETERS', 'https://www.xing.com/pages/lidl'],
    ],
  );
});

describe('pinterest', () => {
  check(
    pinterest,
    [
      ['https://www.pinterest.com/tescohungary', 'PINTEREST_URL'],
      ['https://www.pinterest.com/tescohungary/', 'PINTEREST_URL'],
      ['https://fr.pinterest.com/devred1902/', 'PINTEREST_URL', 'https://www.pinterest.com/devred1902'],
      ['https://www.pinterest.co.uk/tescoireland/', 'PINTEREST_URL', 'https://www.pinterest.com/tescoireland'],
      ['https://www.pinterest.com.au/targetaus', 'PINTEREST_URL', 'https://www.pinterest.com/targetaus'],
      ['https://www.pinterest.com/tesco/rezepte/', 'PINTEREST_URL'],
    ],
    [
      ['pepcoofficial', 'PINTEREST_USERNAME', 'https://www.pinterest.com/pepcoofficial'],
      ['https://www.pinterest.com/pin/123456789/', 'PINTEREST_INVALID'],
      ['https://www.pinterest.com/tesco/_created/', 'PINTEREST_URL_SUBPAGE', 'https://www.pinterest.com/tesco'],
    ],
  );
});

describe('vimeo', () => {
  check(
    vimeo,
    [
      ['openstreetmap', 'VIMEO_USERNAME'],
      ['https://vimeo.com/openstreetmap', 'VIMEO_URL'],
      ['https://vimeo.com/channels/staffpicks', 'VIMEO_URL'],
      ['https://www.vimeo.com/user12345', 'VIMEO_URL', 'https://vimeo.com/user12345'],
    ],
    [
      ['https://vimeo.com/123456789', 'VIMEO_INVALID'],
      ['123456789', 'VIMEO_INVALID'],
    ],
  );
});

describe('flickr', () => {
  check(
    flickr,
    [
      ['https://www.flickr.com/photos/openstreetmap/', 'FLICKR_URL'],
      ['https://www.flickr.com/people/12345678@N00', 'FLICKR_URL'],
      ['https://flickr.com/photos/openstreetmap', 'FLICKR_URL', 'https://www.flickr.com/photos/openstreetmap'],
    ],
    [
      ['openstreetmap', 'FLICKR_INVALID'],
      ['https://www.flickr.com/photos/openstreetmap/53123456789/', 'FLICKR_INVALID'],
      ['https://www.flickr.com/photos/openstreetmap/albums', 'FLICKR_URL_SUBPAGE', 'https://www.flickr.com/photos/openstreetmap'],
    ],
  );
});

describe('vk', () => {
  check(
    vk,
    [
      ['https://vk.com/sberbank', 'VK_URL'],
      ['https://vk.com/club12345', 'VK_URL'],
      ['https://m.vk.com/sberbank', 'VK_URL', 'https://vk.com/sberbank'],
      ['https://vk.ru/sberbank', 'VK_URL', 'https://vk.com/sberbank'],
    ],
    [
      ['VK.com', 'VK_INVALID'],
      ['https://vk.com/feed', 'VK_INVALID'],
    ],
  );
});

describe('tripadvisor', () => {
  check(
    tripadvisor,
    [
      ['17435483', 'TRIPADVISOR_VALID'],
      ['581684', 'TRIPADVISOR_VALID'],
    ],
    [
      ['d17435483', 'TRIPADVISOR_FORMAT', '17435483'],
      [
        'https://www.tripadvisor.ru/Attraction_Review-g294448-d11909602-Reviews-Quests_Pandora_s_Box-Minsk.html',
        'TRIPADVISOR_URL',
        '11909602',
      ],
      [
        'https://tripadvisor.com/Attraction_Review-g48261-d11536549-Reviews-Discover_Niagara_Shuttle-Niagara_Falls_New_York.html',
        'TRIPADVISOR_URL',
        '11536549',
      ],
      ['https://www.tripadvisor.co.uk/Restaurant_Review-g186338-d1234567-Reviews-Pub-London_England.html', 'TRIPADVISOR_URL', '1234567'],
      ['https://www.tripadvisor.de/', 'TRIPADVISOR_URL'],
      ['YYYYYYY', 'TRIPADVISOR_INVALID'],
      ['0123', 'TRIPADVISOR_INVALID'],
    ],
  );
});

describe('real-world values from taginfo', () => {
  it.each([
    ['https://www.facebook.com/mts', 'facebook'],
    ["https://www.linkedin.com/company/mcdonald's-corporation/", 'linkedin'],
    ['https://www.linkedin.com/company/%E1%83%92%E1%83%95%E1%83%98%E1%83%A0%E1%83%98%E1%83%9A%E1%83%90-%E2%80%A2-gvirila', 'linkedin'],
    ['https://www.xing.com/companies/tmgedsgmbh%26co.kg', 'xing'],
    ['https://pl.pinterest.com/hm/', 'pinterest'],
    ['https://vk.com/yandex.market', 'vk'],
  ] as const)('accepts %s', async (value, name) => {
    const validators = await import('../src/index.js');
    expect(validators[name](value).valid).toBe(true);
  });

  it('suggests fixes', () => {
    expect(xing('https://www.xing.com/pages/edeka-zentrale/news').suggestion).toBe('https://www.xing.com/pages/edeka-zentrale');
    expect(tripadvisor('g312848-d2645810')).toMatchObject({ code: 'TRIPADVISOR_FORMAT', suggestion: '2645810' });
    expect(flickr('78801951@N00')).toMatchObject({ code: 'FLICKR_USERNAME', suggestion: 'https://www.flickr.com/photos/78801951@N00' });
    expect(flickr('https://www.flickr.com/photos/exercitobrasileiro/collections/').suggestion).toBe(
      'https://www.flickr.com/photos/exercitobrasileiro',
    );
    expect(vk('pyaterochka')).toMatchObject({ code: 'VK_USERNAME', suggestion: 'https://vk.com/pyaterochka' });
  });
});
