import type { CountryCode } from 'libphonenumber-js';

/**
 * Emergency and other short numbers that are commonly tagged with `phone=*`
 * on emergency infrastructure, by ISO 3166-1 alpha-2 country code.
 *
 * 112 works in all EU member states and many other countries, but is only
 * listed where it is officially in service.
 */
export const EMERGENCY_NUMBERS: Partial<Record<CountryCode, readonly string[]>> = {
  AR: ['100', '101', '107', '911'],
  AT: ['112', '122', '133', '140', '141', '144'],
  AU: ['000', '112', '106'],
  BE: ['112', '100', '101'],
  BR: ['190', '192', '193'],
  CA: ['911'],
  CH: ['112', '117', '118', '144', '145', '1414'],
  CN: ['110', '119', '120', '122'],
  CZ: ['112', '150', '155', '158'],
  DE: ['110', '112', '116117'],
  DK: ['112', '114'],
  ES: ['112', '061', '062', '080', '085', '091', '092'],
  FI: ['112'],
  FR: ['112', '15', '17', '18', '114', '115', '119', '196'],
  GB: ['999', '112'],
  GR: ['112', '100', '166', '199'],
  HR: ['112', '192', '193', '194'],
  HU: ['112', '104', '105', '107'],
  IE: ['999', '112'],
  IN: ['112', '100', '101', '102', '108'],
  IT: ['112', '113', '115', '118', '1530'],
  JP: ['110', '118', '119'],
  KR: ['112', '119'],
  LU: ['112', '113'],
  MX: ['911'],
  NL: ['112'],
  NO: ['110', '112', '113'],
  NZ: ['111'],
  PL: ['112', '997', '998', '999'],
  PT: ['112'],
  RO: ['112'],
  RU: ['112', '101', '102', '103', '104'],
  SE: ['112'],
  SI: ['112', '113'],
  SK: ['112', '150', '155', '158'],
  TH: ['191', '199', '1669'],
  TR: ['112'],
  UA: ['112', '101', '102', '103', '104'],
  US: ['911'],
  ZA: ['10111', '10177', '112'],
};

/** Returns true if `number` is an emergency number of `country`, or of any country if none is given. */
export function isEmergencyNumber(number: string, country?: CountryCode): boolean {
  const lists = country === undefined
    ? Object.values(EMERGENCY_NUMBERS)
    : [EMERGENCY_NUMBERS[country] ?? []];
  return lists.some((list) => list?.includes(number));
}
