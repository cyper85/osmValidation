import { describe, expect, it } from 'vitest';
import { wikidata, wikipedia } from '../src/index.js';

describe('wikipedia', () => {
  it.each(['de:Ilmenau', 'de:iD (OpenStreetMap)', 'de:Österreich', 'zh-yue:香港', 'be-tarask:Менск', 'simple:Berlin'])(
    'accepts %s',
    (value) => {
      expect(wikipedia(value)).toEqual({ valid: true, code: 'WIKIPEDIA_VALID', message: expect.any(String) });
    },
  );

  it.each([
    ['OpenStreetMap', 'WIKIPEDIA_LANGUAGE_MISSING'],
    ['Österreich', 'WIKIPEDIA_LANGUAGE_MISSING'],
    ['User:Cyper', 'WIKIPEDIA_LANGUAGE_MISSING'],
    ['user:cyper', 'WIKIPEDIA_LANGUAGE_MISSING'],
    ['./invalid', 'WIKIPEDIA_LANGUAGE_MISSING'],
    ['de:User:Cyper', 'WIKIPEDIA_INVALID'],
    ['de:./invalid', 'WIKIPEDIA_INVALID'],
    ['de:/tmp/test/.', 'WIKIPEDIA_INVALID'],
    ['de:false [bracket]', 'WIKIPEDIA_INVALID'],
    ['de:Three Tildes ~~~ Test', 'WIKIPEDIA_INVALID'],
    ['de:Ilmenau#Geschichte', 'WIKIPEDIA_INVALID'],
    ['de:', 'WIKIPEDIA_INVALID'],
  ])('rejects %s (%s)', (value, code) => {
    expect(wikipedia(value)).toMatchObject({ valid: false, code });
  });

  it('suggests "language:Title" for URLs', () => {
    expect(wikipedia('https://de.wikipedia.org/wiki/ID_(OpenStreetMap)')).toMatchObject({
      valid: false,
      code: 'WIKIPEDIA_URL',
      suggestion: 'de:ID (OpenStreetMap)',
    });
    expect(wikipedia('https://de.m.wikipedia.org/wiki/Stra%C3%9Fe').suggestion).toBe('de:Straße');
    expect(wikipedia('https://en.wikipedia.org/w/index.php?title=Main_Street').suggestion).toBe('en:Main Street');
    expect(wikipedia('https://de.wikipedia.org/wiki/Ilmenau#Geschichte').suggestion).toBeUndefined();
  });

  it('suggests a readable title', () => {
    expect(wikipedia('de:Technische_Universität_Ilmenau')).toMatchObject({
      valid: true,
      suggestion: 'de:Technische Universität Ilmenau',
    });
    expect(wikipedia('de:Stra%C3%9Fe')).toMatchObject({ valid: false, code: 'WIKIPEDIA_ENCODED', suggestion: 'de:Straße' });
  });
});

describe('wikidata', () => {
  it('accepts Q936', () => {
    expect(wikidata('Q936')).toMatchObject({ valid: true, code: 'WIKIDATA_VALID' });
  });

  it.each(['FALSE', 'Q', 'Q0', 'Q01', 'P31', 'Q936;Q64'])('rejects %s', (value) => {
    expect(wikidata(value)).toMatchObject({ valid: false, code: 'WIKIDATA_INVALID' });
  });

  it('suggests the plain ID', () => {
    expect(wikidata('https://www.wikidata.org/wiki/Q936')).toMatchObject({ code: 'WIKIDATA_URL', suggestion: 'Q936' });
    expect(wikidata('http://www.wikidata.org/entity/Q64')).toMatchObject({ suggestion: 'Q64' });
    expect(wikidata('q936')).toMatchObject({ code: 'WIKIDATA_FORMAT', suggestion: 'Q936' });
  });
});
