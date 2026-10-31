// National flag used for each geographic area on the current 36-area board.
// ISO alpha-2 codes are served as SVG-compatible PNGs by FlagCDN.
export const TERRITORY_FLAGS: Record<string, string> = {
  G01: 'us', // Alaska
  G02: 'ca', // Northwest Territories
  G03: 'gl', // Greenland
  G04: 'ca', // Central Canada
  G05: 'ca', // Quebec
  G06: 'us', // Western United States
  G07: 'us', // Eastern United States
  G08: 'gt', // Central America
  G09: 'co', // Northern Andes
  G10: 'br', // Brazil
  G11: 'ar', // Southern Cone
  G12: 'is', // Iceland
  G13: 'se', // Scandinavia
  G14: 'pl', // Eastern Europe
  G15: 'gb', // British Isles and North Sea
  G16: 'fr', // Western Europe
  G17: 'it', // Southern Europe
  G18: 'ma', // North Africa
  G19: 'eg', // Egypt
  G20: 'ke', // East Africa
  G21: 'za', // Central and Southern Africa
  G22: 'mg', // Madagascar
  G23: 'ru', // Urals
  G24: 'ru', // Siberia
  G25: 'ru', // Siberian Lakes
  G26: 'ru', // Kamchatka
  G27: 'mn', // Mongolia
  G28: 'jp', // Japan
  G29: 'af', // Afghanistan
  G30: 'cn', // China
  G31: 'sa', // Middle East
  G32: 'in', // India
  G33: 'th', // Southeast Asia
  G34: 'id', // Indonesia
  G35: 'pg', // New Guinea
  G36: 'au', // Australia
};

const LEGACY_NODE_FLAGS: Record<string, string> = {
  N1: 'ca', N2: 'us', N3: 'mx', I1: 'br', I2: 'ar', I3: 'cl',
  C1: 'fr', C2: 'de', C3: 'it', C4: 'eg', S1: 'za', S2: 'in', S3: 'au',
};

export function getTerritoryFlagCode(territoryId?: string | null): string | undefined {
  if (!territoryId) return undefined;
  return TERRITORY_FLAGS[territoryId] ?? LEGACY_NODE_FLAGS[territoryId];
}
