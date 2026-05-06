// scraperApi.js — ScraperAPI avec recherche intelligente par EAN
import { supabase } from './supabaseClient';

const SCRAPER_BASE = 'https://api.scraperapi.com/structured/amazon/search';
const SCRAPER_PRODUCT_BASE = 'https://api.scraperapi.com/structured/amazon/product';

// ─── Normalisation EAN ───────────────────────────────────────────────────────
// EAN-14 commençant par 0 → retire le 0 pour obtenir l'EAN-13 réel
export function normalizeEAN(code) {
  const clean = code.replace(/\D/g, '');
  if (clean.length === 14 && clean.startsWith('0')) {
    return clean.slice(1); // 04005556173495 → 4005556173495
  }
  return clean;
}

// ─── Détection marque par préfixe EAN ────────────────────────────────────────
const EAN_PREFIX_MAP = [
  { prefix: ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '419', '420', '421', '422', '423', '424', '425', '426', '427', '428', '429', '430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440'], brand: 'Ravensburger', country: 'de' },
  { prefix: ['306', '307', '308', '309'], brand: 'Clementoni', country: 'fr' },
  { prefix: ['350', '351', '352', '353', '354', '355', '356', '357', '358', '359'], brand: 'Nathan', country: 'fr' },
  { prefix: ['871', '872', '873', '874', '875'], brand: 'Jumbo', country: 'us' },
  { prefix: ['021', '022', '023'], brand: 'Ceaco', country: 'us' },
  { prefix: ['814'], brand: 'MasterPieces', country: 'us' },
  { prefix: ['076', '077'], brand: 'White Mountain Puzzles', country: 'us' },
  { prefix: ['080', '081', '082', '083'], brand: 'Milton Bradley', country: 'us' },
  { prefix: ['074', '075'], brand: 'Buffalo Games', country: 'us' },
  { prefix: ['601', '602', '603', '604', '605', '606', '607', '608', '609'], brand: 'Eurographics', country: 'us' },
  { prefix: ['088'], brand: 'Cobble Hill', country: 'us' },
  { prefix: ['625', '626'], brand: 'Galison', country: 'us' },
];

export function detectBrandFromEAN(ean13) {
  const prefix3 = ean13.slice(0, 3);
  const match = EAN_PREFIX_MAP.find(entry => entry.prefix.includes(prefix3));
  return match || null;
}

// ─── Clé ScraperAPI ──────────────────────────────────────────────────────────
export async function getScraperApiKey() {
  try {
    const { data, error } = await supabase
      .from('page_settings')
      .select('settings')
      .eq('page_name', 'scraper_api_settings')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.settings?.api_key ?? null;
  } catch (e) {
    console.error('Erreur récupération clé ScraperAPI:', e);
    return null;
  }
}

// ─── Recherche Amazon générique ───────────────────────────────────────────────
async function searchAmazonRaw(query, key, countryCode = 'us') {
  try {
    const url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=${countryCode}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`ScraperAPI ${countryCode} erreur ${response.status} pour: ${query}`);
      return [];
    }
    const data = await response.json();
    return data?.results ?? data?.organic_results ?? [];
  } catch (e) {
    console.error('searchAmazonRaw erreur:', e);
    return [];
  }
}

// ─── Recherche principale intelligente ───────────────────────────────────────
export async function searchAmazon(rawCode, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  // 1. Normaliser l'EAN
  const ean = normalizeEAN(rawCode);
  console.log(`EAN normalisé: ${rawCode} → ${ean}`);

  // 2. Détecter la marque
  const brandInfo = detectBrandFromEAN(ean);
  console.log('Marque détectée:', brandInfo);

  let results = [];

  // 3. Recherche "Marque + EAN" si marque détectée
  if (brandInfo) {
    console.log(`Tentative 1: "${brandInfo.brand} ${ean}"`);
    results = await searchAmazonRaw(`${brandInfo.brand} ${ean}`, key, 'us');
    if (results.length > 0) return results;

    // 4. Recherche "Marque + puzzle + EAN"
    console.log(`Tentative 2: "${brandInfo.brand} puzzle ${ean}"`);
    results = await searchAmazonRaw(`${brandInfo.brand} puzzle ${ean}`, key, 'us');
    if (results.length > 0) return results;
  }

  // 5. Recherche EAN seul sur Amazon US
  console.log(`Tentative 3: EAN seul "${ean}"`);
  results = await searchAmazonRaw(ean, key, 'us');
  if (results.length > 0) return results;

  // 6. Recherche "puzzle + EAN"
  console.log(`Tentative 4: "puzzle ${ean}"`);
  results = await searchAmazonRaw(`puzzle ${ean}`, key, 'us');
  if (results.length > 0) return results;

  // 7. Si marque connue, recherche sur Amazon du pays d'origine
  if (brandInfo && brandInfo.country !== 'us') {
    console.log(`Tentative 5: "${brandInfo.brand} ${ean}" sur Amazon.${brandInfo.country}`);
    results = await searchAmazonRaw(`${brandInfo.brand} ${ean}`, key, brandInfo.country);
    if (results.length > 0) return results;
  }

  // 8. Recherche EAN brut original (avant normalisation) si différent
  if (rawCode !== ean) {
    console.log(`Tentative 6: code original "${rawCode}"`);
    results = await searchAmazonRaw(rawCode, key, 'us');
    if (results.length > 0) return results;
  }

  console.log('Aucun résultat trouvé pour:', ean);
  return [];
}

// ─── Détail produit par ASIN ──────────────────────────────────────────────────
export async function getProductByAsin(asin, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=us`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  const data = await response.json();
  console.log('ScraperAPI getProductByAsin:', data);
  return data;
}

// ─── Crédits ScraperAPI ───────────────────────────────────────────────────────
export async function getScraperCredits(apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const url = `https://api.scraperapi.com/account?api_key=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  const data = await response.json();
  console.log('ScraperAPI account:', data);
  const limit = data?.requestCount?.monthlyLimit ?? 0;
  const used = data?.requestCount?.thisMonthUsageCount ?? 0;
  return limit - used;
}

export function invalidateScraperCache() {}