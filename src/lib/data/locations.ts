/**
 * Location data and utilities
 * For now, this is a simplified implementation
 * TODO: Integrate with a proper geography API or database
 */

// Common countries (expandable)
export const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
] as const

// Major cities by country (simplified, expandable)
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  FR: [
    'Paris',
    'Lyon',
    'Marseille',
    'Toulouse',
    'Nice',
    'Nantes',
    'Bordeaux',
    'Lille',
    'Strasbourg',
    'Rennes',
    'Montpellier',
  ],
  GB: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool'],
  DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice'],
  BE: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège'],
  CH: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'],
  LU: ['Luxembourg City'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  US: [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'San Francisco',
    'Boston',
    'Seattle',
  ],
  CA: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
}

// Regions by country (simplified, expandable)
export const REGIONS_BY_COUNTRY: Record<string, string[]> = {
  FR: [
    'Île-de-France',
    'Auvergne-Rhône-Alpes',
    'Nouvelle-Aquitaine',
    'Occitanie',
    "Provence-Alpes-Côte d'Azur",
    'Bretagne',
    'Grand Est',
    'Hauts-de-France',
    'Normandie',
    'Pays de la Loire',
    'Bourgogne-Franche-Comté',
    'Centre-Val de Loire',
    'Corse',
  ],
  GB: [
    'England',
    'Scotland',
    'Wales',
    'Northern Ireland',
    'Greater London',
    'South East',
    'North West',
  ],
  DE: [
    'Bavaria',
    'North Rhine-Westphalia',
    'Baden-Württemberg',
    'Berlin',
    'Hamburg',
    'Hesse',
  ],
  ES: [
    'Madrid',
    'Catalonia',
    'Andalusia',
    'Valencia',
    'Basque Country',
    'Galicia',
  ],
  IT: ['Lazio', 'Lombardy', 'Campania', 'Piedmont', 'Tuscany', 'Veneto'],
  BE: ['Brussels', 'Flanders', 'Wallonia'],
  CH: [
    'Zurich',
    'Geneva',
    'Basel-Stadt',
    'Vaud',
    'Bern',
    'Ticino',
    'Valais',
  ],
  LU: ['Luxembourg'],
  NL: [
    'North Holland',
    'South Holland',
    'Utrecht',
    'North Brabant',
    'Limburg',
  ],
  US: [
    'California',
    'New York',
    'Texas',
    'Florida',
    'Illinois',
    'Massachusetts',
    'Washington',
  ],
  CA: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
}

/**
 * Get cities for a given country code
 */
export function getCitiesForCountry(countryCode: string): string[] {
  return CITIES_BY_COUNTRY[countryCode] || []
}

/**
 * Get regions for a given country code
 */
export function getRegionsForCountry(countryCode: string): string[] {
  return REGIONS_BY_COUNTRY[countryCode] || []
}

/**
 * Auto-detect region from city and country
 * This is a simplified implementation
 * In production, use a proper geography database
 */
export function detectRegion(city: string, countryCode: string): string | null {
  // Simplified mapping for France (most common use case)
  if (countryCode === 'FR') {
    const cityLower = city.toLowerCase()
    if (cityLower === 'paris') return 'Île-de-France'
    if (cityLower === 'lyon') return 'Auvergne-Rhône-Alpes'
    if (cityLower === 'marseille') return "Provence-Alpes-Côte d'Azur"
    if (cityLower === 'toulouse') return 'Occitanie'
    if (cityLower === 'nice') return "Provence-Alpes-Côte d'Azur"
    if (cityLower === 'nantes') return 'Pays de la Loire'
    if (cityLower === 'bordeaux') return 'Nouvelle-Aquitaine'
    if (cityLower === 'lille') return 'Hauts-de-France'
    if (cityLower === 'strasbourg') return 'Grand Est'
    if (cityLower === 'rennes') return 'Bretagne'
    if (cityLower === 'montpellier') return 'Occitanie'
  }

  // For other countries, return null (user can manually select)
  return null
}

/**
 * Get country name from code
 */
export function getCountryName(countryCode: string): string | null {
  const country = COUNTRIES.find((c) => c.value === countryCode)
  return country?.label || null
}

/**
 * Default language for a country
 */
export function getDefaultLanguageForCountry(countryCode: string): string {
  const languageMap: Record<string, string> = {
    FR: 'Français',
    GB: 'English',
    DE: 'Deutsch',
    ES: 'Español',
    IT: 'Italiano',
    BE: 'Français',
    CH: 'Français',
    LU: 'Français',
    NL: 'Nederlands',
    US: 'English',
    CA: 'English',
  }
  return languageMap[countryCode] || 'English'
}
